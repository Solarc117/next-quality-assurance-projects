import '../../types/index.js'
const chaiHttp = require('chai-http'),
  chai = require('chai'),
  Browser = require('zombie'),
  assert = require('./modified-assert.js'),
  [
    // @ts-ignore
    TEST_DOC_1,
    // @ts-ignore
    TEST_DOC_2,
    // @ts-ignore
    TEST_DOC_3,
    // @ts-ignore
    TEST_DOC_4,
    // @ts-ignore
    TEST_DOC_5,
    // @ts-ignore
    TEST_DOC_6,
    // @ts-ignore
    TEST_DOC_7,
    // @ts-ignore
    TEST_DOC_8,
  ] = require('./data/projects.json'),
  ISSUES = '/api/issues',
  SERVER = new URL(process.env.NODE_ENV === 'production' ? 'VERCEL-DOMAIN-HERE/api/issues' : `localhost:${process.env.PORT}/api/issues`)

chai.use(chaiHttp)

suite('🧪 Issue Tracker: End to End', () => {
  const setup1Path = `${ISSUES}/${TEST_DOC_1.project}`,
    setup2Path = `${ISSUES}/${TEST_DOC_2.project}`,
    setup3Path = `${ISSUES}/${TEST_DOC_3.project}`,
    setup4Path = `${ISSUES}/${TEST_DOC_8.project}`
  suiteSetup(() => chai.request(SERVER).delete(ISSUES))

  test('Suite setup successful', done => {
    chai
    .request(SERVER)
    .get(setup1Path)
      .end((err, res) => {
        const { status, ok, body: issues } = res,
        { title, assigned_to } = issues[0]
        
        assert.areNull(err, assigned_to)
        assert.strictEqualPairs([status, 200], [issues.length, 1])
        assert.isArray(issues)
        assert.areObjects(...issues)
        assert.isTrue(ok)
        assert.isString(title)
        
        done()
        
      })
  })
  test('Suite setup 2 successful', done => {
    chai
      .request(SERVER)
      .get(setup2Path)
      .end((err, res) => {
        const { status, ok, body: issues } = res

        assert.isNull(err)
        assert.strictEqualPairs([status, 200], [issues.length, 4])
        assert.isTrue(ok)
        assert.isArray(issues)
        assert.areObjects(...issues)

        done()
      })
  })

  test('Suite setup 3 successful', done => {
    chai
      .request(SERVER)
      .get(setup3Path)
      .end((err, res) => {
        const { status, ok, body: issues } = res

        assert.isNull(err)
        assert.strictEqual(status, 200)
        assert.isTrue(ok)
        assert.isArray(issues)
        assert.strictEqual(issues.length, 0)
        assert.areObjects(...issues)

        done()
      })
  })

  test('Suite setup 4 successful', done => {
    chai
      .request(SERVER)
      .get(setup4Path)
      .end((err, res) => {
        const { status, ok, body: issues } = res

        assert.isArray(issues)
        assert.areObjects(...issues)
        assert.strictEqualPairs(
          [status, 200],
          [issues.length, 3],
          [Object.keys(issues[0]).length, 9]
        )

        const {
          title, // s
          text, // s
          created_by, // chris
          assigned_to, // null
          status_text, // null
          open, // true
          created_on, // new date
          last_updated, // new date
          index, // 0
        } = issues[0]

        assert.areNull(err, assigned_to, status_text)
        assert.areTrue(ok, open)
        assert.areStrings(title, text, created_by)
        assert.strictEqual(index, 0)
        // Assert created_on and last_updated within 2s of the current date.
        for (const dateStr of [created_on, last_updated])
          assert.approximately(
            new Date(dateStr).valueOf(),
            new Date().valueOf(),
            2000
          )

        done()
      })
  })

  const test1Path = `${ISSUES}/${TEST_DOC_1.project}`
  test(`1. GET ${test1Path}`, done => {
    chai
      .request(SERVER)
      .get(test1Path)
      .end((err, res) => {
        const { status, ok, body: issues } = res,
          { title, text, created_by, assigned_to, status_text } = issues[0]

        assert.isNull(err)
        assert.strictEqual(status, 200)
        assert.isTrue(ok)
        assert.areStrings(title, text, created_by)
        assert.areNull(assigned_to, status_text)

        done()
      })
  })

  const test2Path = `${ISSUES}/${TEST_DOC_4.project}`
  test(`2. Create with every field except _id: POST ${test2Path}`, done => {
    chai
      .request(SERVER)
      .post(test2Path)
      .send(TEST_DOC_4)
      .end((err, res) => {
        const { status, ok, body } = res,
          { acknowledged, insertedId } = body

        assert.isNull(err)
        assert.strictEqual(status, 200)
        assert.areTrue(ok, acknowledged)
        assert.isString(insertedId)

        done()
      })
  })

  const test3Path = `${ISSUES}/${TEST_DOC_5.project}`
  test(`3. Create with only required fields: POST ${test3Path}`, done => {
    chai
      .request(SERVER)
      .post(test3Path)
      .send(TEST_DOC_5)
      .end((err, res) => {
        const {
          status,
          ok,
          body: { acknowledged, insertedId },
        } = res

        assert.isNull(err)
        assert.strictEqual(status, 200)
        assert.isTrue(ok, acknowledged)
        assert.isString(insertedId)

        done()
      })
  })

  const test4Path = `${ISSUES}/${TEST_DOC_6.project}`
  test(`4. Create with missing required fields: POST ${test4Path}`, done => {
    chai
      .request(SERVER)
      .post(test4Path)
      .send(TEST_DOC_6)
      .end((err, res) => {
        const { status, ok, body } = res,
          { error } = body

        assert.isNull(err)
        assert.strictEqual(status, 400)
        assert.isFalse(ok)
        assert.isString(error)

        done()
      })
  })

  const test5Path = `${ISSUES}/${TEST_DOC_7.project}`
  test(`5. Include _id field in project: POST ${test5Path}`, done => {
    chai
      .request(SERVER)
      .post(test5Path)
      .send(TEST_DOC_7)
      .end((err, res) => {
        const { status, ok, body } = res,
          { error } = body

        assert.isNull(err)
        assert.strictEqual(status, 400)
        assert.isFalse(ok)
        assert.isString(error)
        assert.include(error, '_id')

        done()
      })
  })

  const test6Path = `${ISSUES}/${TEST_DOC_1.project}`
  test(`6. GET ${test6Path}`, done => {
    chai
      .request(SERVER)
      .get(test6Path)
      .end((err, res) => {
        const { status, ok, body: issues } = res,
          issue = issues[0],
          {
            assigned_to,
            created_by,
            created_on,
            last_updated,
            status_text,
            text,
            title,
            open,
            index,
          } = issue

        assert.areNull(err, assigned_to, status_text)
        assert.strictEqualPairs(
          [status, 200],
          [issues.length, 1],
          [Object.keys(issue).length, 9],
          [index, 0]
        )
        assert.areTrue(ok, open)
        assert.areStrings(created_by, created_on, last_updated, text, title)

        done()
      })
  })

  const test7Params = '?assigned_to',
    test7Path = `${ISSUES}/${TEST_DOC_2.project}${test7Params}`
  test(`7. View issues with one filter: GET ${test7Path}`, done => {
    chai
      .request(SERVER)
      .get(test7Path)
      .end((err, res) => {
        const { status, ok, body: issues } = res,
          {
            title,
            text,
            created_by,
            created_on,
            last_updated,
            assigned_to,
            status_text,
          } = issues[0]

        assert.areNull(err, assigned_to, status_text)
        assert.strictEqualPairs([status, 200], [issues.length, 1])
        assert.isTrue(ok)
        assert.areStrings(title, text, created_by, created_on, last_updated)

        done()
      })
  })

  const test8Params = '?title=podcast&assigned_to=sol',
    test8Path = `${ISSUES}/${TEST_DOC_2.project}${test8Params}`
  test(`8. View issues with multiple filters: GET ${test8Path}`, done => {
    chai
      .request(SERVER)
      .get(test8Path)
      .end((err, res) => {
        // I might want to consider using optional chaining, if destructuring from an undefined value causes my site to crash - ex:
        // issue = issues?.[0]
        // assert.isNull(issue?.status_text)
        const { status, ok, body: issues } = res,
          { title, text, created_by, assigned_to, status_text } = issues[0]

        assert.areNull(err, status_text)
        assert.strictEqualPairs([status, 200], [issues.length, 1])
        assert.isTrue(ok)
        assert.isArray(issues)
        assert.areStrings(title, text, created_by, assigned_to)

        done()
      })
  })

  const test9Params = '?index=0',
    test9Path = `${ISSUES}/${TEST_DOC_1.project}${test9Params}`
  test(`9. Update one field on an issue: PATCH ${test9Path}`, done => {
    const fieldsToUpdate = {
      assigned_to: TEST_DOC_1.owner,
    }

    chai
      .request(SERVER)
      .patch(test9Path)
      .send(fieldsToUpdate)
      .end((err, res) => {
        const {
          status,
          ok,
          body: { acknowledged, modifiedCount },
        } = res

        assert.isNull(err)
        assert.strictEqualPairs([status, 200], [modifiedCount, 1])
        assert.areTrue(ok, acknowledged)

        done()
      })
  })

  const test10Params = '?index=2',
    test10Path = `${ISSUES}/${TEST_DOC_2.project}${test10Params}`
  test(`10. Update multiple fields: PATCH ${test10Path}`, done => {
    const fieldsToUpdate = {
      status_text: 'finished',
      open: false,
    }

    chai
      .request(SERVER)
      .patch(test10Path)
      .send(fieldsToUpdate)
      .end((err, res) => {
        const {
          status,
          ok,
          body: { acknowledged, modifiedCount },
        } = res

        assert.isNull(err)
        assert.strictEqualPairs([status, 200], [modifiedCount, 1])
        assert.areTrue(ok, acknowledged)

        done()
      })
  })

  const test11Params = '?index=0',
    test11Path = `${ISSUES}/${TEST_DOC_8.project}${test11Params}`
  test(`11. Update with no fields: PATCH ${test11Path}`, done => {
    chai
      .request(SERVER)
      .patch(test11Path)
      .end((err, res) => {
        const {
          status,
          ok,
          body: { error },
        } = res

        assert.isNull(err)
        assert.strictEqual(status, 400)
        assert.isFalse(ok)
        assert.isString(error)

        done()
      })
  })

  const test12Params = '?index=1',
    test12Path = `${ISSUES}/${TEST_DOC_8.project}${test12Params}`
  test(`12. DELETE ${test12Path}`, done => {
    chai
      .request(SERVER)
      .delete(test12Path)
      .end((err, res) => {
        const {
          status,
          ok,
          body: { acknowledged, modifiedCount },
        } = res

        assert.isNull(err)
        assert.strictEqualPairs([status, 200], [modifiedCount, 1])
        assert.areTrue(ok, acknowledged)

        done()
      })
  })
})
