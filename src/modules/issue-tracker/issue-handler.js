import '../../../types/index.js'
import sanitize from 'mongo-sanitize'
import { ObjectId } from 'mongodb'
import IssuesDAO from './issues-dao.js'

export default class IssueHandler {
  /**
   * @description Calls the IssuesDAO dropTest method, and sends json to the client depicting the result.
   * @param {object} req The Express request object.
   * @param {object} res The Express response object.
   */
  static async drop(req, res) {
    const dropResult = await IssuesDAO.dropTest()

    dropResult?.error
      ? res.status(500).json({ error: 'could not drop test collection' })
      : res.status(200).json({ success: true })
  }

  /**
   * @description Fetches all projects in database, and returns their names.
   * @param {object} req The Express request object.
   * @param {object} res The Express response object.
   */
  static async getProjects(req, res) {
    const result = await IssuesDAO.fetchProjects()

    Array.isArray(result)
      ? res.status(200).json(result)
      : res.status(500).json({ error: 'could not fetch projects' })
  }

  /**
   * @description Fetches a project from the database using its title. Responds with null if no match was found, or otherwise with the project's issues. Filters the issues array if any queries were passed. Responds with an error object and status code 500 if a server error is encountered.
   * @param {object} req The Express request object.
   * @param {object} res The Express response object.
   */
  static async getProjectIssues(req, res) {
    function filterIssues(issues = [], queries = {}) {
      const queryKeys = Object.keys(queries)

      // To prevent data mutation and keep this function "pure", we create a copy of issues with the spread operator instead of acting on the parameter, since the Array.filter method creates a shallow copy of the array argument, which can lead to unexpected behaviour.
      return [...issues].filter(issue => {
        for (const query of queryKeys) {
          const queryValue = queries[query],
            issueValue = issue[query]

          return query === 'open' ||
            query === 'created_on' ||
            query === 'last_updated'
            ? queryValue === issueValue
            : issueValue.match(new RegExp(queryValue, 'i'))
        }
        return true
      })
    }
    function queryAndIssuesValid(DAOResult, queryObj) {
      return (
        Array.isArray(DAOResult?.issues) &&
        queryObj !== null &&
        typeof queryObj === 'object' &&
        Object.keys(queryObj).length > 0
      )
    }
    const { query: issueQueries } = req,
      { project: projectName } = issueQueries,
      sanitizedProjectName = sanitize(projectName)
    delete issueQueries.project
    if (typeof issueQueries.open === 'string' && issueQueries.open.length > 0)
      issueQueries.open = new Boolean(issueQueries.open).valueOf()

    const result = await IssuesDAO.fetchProject(sanitizedProjectName)

    // @ts-ignore
    if (typeof result?.error === 'string')
      return res.status(500).json({ error: 'could not get issues' })

    if (queryAndIssuesValid(result, issueQueries))
      // @ts-ignore
      result.issues = filterIssues(
        // @ts-ignore
        result.issues,
        issueQueries
      )

    // Return null if there is no such project; or an array containing however many issues the existing project has.
    // @ts-ignore
    res.status(200).json(result?.issues || null)
  }

  /**
   * @description Attempts to append an issue to a project. Creates the project if it does not exist.
   * @param {object} req The Express request object.
   * @param {object} res The Express response object.
   */
  static async appendIssue(req, res) {
    function updateIssueDates(issue) {
      const date = new Date(),
        today = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`

      issue.created_on = today
      issue.last_updated = today
    }
    const { query: issue } = req,
      { project: projectName } = issue,
      sanitizedProjectName = sanitize(projectName),
      openType = typeof issue.open
    delete issue.project
    sanitize(issue)

    if (openType !== 'boolean' && openType !== 'undefined')
      return res.status(400).json({
        error: `unexpected open property of type ${openType} on project - expected a boolean or undefined`,
      })

    updateIssueDates(issue)

    // Do not require a trycatch block for the following asynchronous method, because it itself will handle errors returned by the db and return an object with an error property.
    const result = await IssuesDAO.upsertProject(sanitizedProjectName, issue)

    // Remember to verify that all error properties the DAO returns are SERVER, and not CLIENT errors. DAO should only be dealing with server errors at this point; client errors (bad requests) should be handled by the handler.
    result?.error
      ? res.status(500).json({ error: 'could not submit issue' })
      : res.status(200).json({
          success: true,
        })
  }

  /**
   * @description Attempts to post the received project to the database. Automatically assigns a new ObjectId to new projects.
   * @param {object} req The Express request object.
   * @param {object} res The Express response object.
   */
  static async post(req, res) {
    function objHasProps(obj, props) {
      for (const prop of props)
        if (obj[prop] === undefined) {
          res.status(400).json({ error: `missing ${prop} field` })
          return false
        }

      return true
    }
    function nullifyUndefProps(obj, props) {
      for (const prop of props) if (obj[prop] === undefined) obj[prop] = null
    }
    function verifyAndFormatIssues(project) {
      if (!Array.isArray(project?.issues)) return true

      const now = new Date().toUTCString()
      for (const [i, issue] of project.issues.entries()) {
        if (!objHasProps(issue, issueProps.required)) return false
        issue.created_on = now
        issue.index = i
        nullifyUndefProps(issue, issueProps.optional)
      }

      return true
    }
    const { body: project } = req,
      projectProps = ['project', 'owner', 'issues'],
      issueProps = {
        required: ['title', 'created_by'],
        optional: ['text', 'assigned_to', 'status_text'],
      }
    let postResult

    if (!objHasProps(project, projectProps)) return

    for (const prop of ['_id', 'open', 'index'])
      if (project[prop] !== undefined)
        return res.status(400).json({
          error: `unexpected ${prop} property of type ${typeof project[
            prop
          ]} on project - it is automatically assigned`,
        })
      else project[prop] = prop === '_id' ? new ObjectId() : true

    if (!verifyAndFormatIssues(project)) return

    postResult = await IssuesDAO.createProject(project)

    res.status(postResult?.error ? 500 : 200).json(postResult)
  }

  /**
   * @description Attempts to update a single issue of the specified index, under the specified project. May only update title, text, assigned_to, status_text, and/or open properties of issues.
   * @param {object} req The Express request body.
   * @param {object} res The Express response body.
   */
  static async patch(req, res) {
    const {
        body,
        params: { project },
        query: { index },
      } = req,
      query = { project }
    query.index = +index
    let patchResult

    for (const prop of ['index', 'created_by', 'created_on', 'last_updated'])
      if (body.prop !== undefined)
        return res.status(400).json({
          error: `unexpected property ${prop} on issue update - this property cannot be updated`,
        })

    if (Object.keys(body).length === 0)
      return res.status(400).json({
        error: 'no update fields passed - please include at least one field',
      })

    patchResult = await IssuesDAO.updateIssue(query, body)

    res.status(patchResult?.error ? 500 : 200).json(patchResult)
  }

  /**
   * @description Attempts to delete the specified issue of the specified project from the database.
   * @param {object} req The Express request object.
   * @param {object} res The Express response object.
   */
  static async delete(req, res) {
    const {
        query,
        params: { project },
      } = req,
      index = +query.index
    let deleteResult

    deleteResult = await IssuesDAO.deleteIssue(project, index)

    return res.status(deleteResult?.error ? 500 : 200).json(deleteResult)
  }
}
