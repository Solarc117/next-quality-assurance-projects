const chai = require('chai'),
  chaiHttp = require('chai-http'),
  Browser = require('zombie'),
  assert = require('./modified-assert.js'),
  TEST_DOCS = require('./data/books.json')

const [TEST_DOC_1, TEST_DOC_2, TEST_DOC_3, TEST_DOC_4, TEST_DOC_5] = TEST_DOCS,
  { env } = process,
  BOOK_PATH = '/api/books'

chai.use(chaiHttp)
Browser.site = `http://localhost:${env.PORT || 3000}/`

suite('🧪 \x1b[35mPersonal Library: HTTP\n', () => {
  suiteSetup(() => chai.request(Browser.site).delete(BOOK_PATH))
  suiteSetup(() => chai.request(Browser.site).post(BOOK_PATH).send(TEST_DOC_1))
  suiteSetup(() => chai.request(Browser.site).post(BOOK_PATH).send(TEST_DOC_2))
  suiteSetup(() => chai.request(Browser.site).post(BOOK_PATH).send(TEST_DOC_3))

  test(`1. GET ${BOOK_PATH}, and POST ${BOOK_PATH}/:_id`, done => {
    chai
      .request(Browser.site)
      .get(BOOK_PATH)
      .end((err, res) => {
        const { status, ok, body: books } = res,
          { _id } = books?.[2]

        assert.isNull(err)
        assert.strictEqualPairs(
          [status, 200],
          [books.length, 3],
          [books[2].commentcount, 0]
        )
        assert.isTrue(ok)

        const testPath = `${BOOK_PATH}/${_id}`,
          testBody = {
            comment: "don't know this book :/",
          }
        chai
          .request(Browser.site)
          .post(testPath)
          .send(testBody)
          .end((err, res) => {
            const {
              status,
              ok,
              body: { _id, title, commentcount, comments },
            } = res

            assert.isNull(err)
            assert.strictEqualPairs(
              [status, 200],
              [commentcount, comments.length]
            )
            assert.isTrue(ok)
            assert.areStrings(_id, title, ...comments)

            done()
          })
      })
  })

  test(`2. create a valid book: POST ${BOOK_PATH}`, done => {
    chai
      .request(Browser.site)
      .post(BOOK_PATH)
      .send(TEST_DOC_4)
      .end((err, res) => {
        const { status, ok, body } = res,
          { _id, title } = body

        assert.isNull(err)
        assert.strictEqualPairs([status, 200], [Object.keys(body).length, 2])
        assert.isTrue(ok)
        assert.areStrings(_id, title)

        done()
      })
  })

  test(`3. create an invalid book: POST ${BOOK_PATH}`, done => {
    chai
      .request(Browser.site)
      .post(BOOK_PATH)
      .send(TEST_DOC_5)
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
})

suite('🧪 \x1b[35mPersonal Library: Browser\n', () => {
  const browser = new Browser()

  suiteSetup(() => browser.visit('/personal-library'))

  // @ts-ignore
  test('browser setup', () => assert.isString(browser.site))

  test('1. book submitted is displayed in ul', done => {
    const newBookTitle = 'The Hunger Games'

    browser.assert.element('form#newBookForm')
    browser.fill('#bookTitleToAdd', newBookTitle)
    browser.pressButton('#newBook', () => {
      browser.assert.elements('li.bookItem', 5)

      done()
    })
  })

  test('2. clicking on a book displays information and form', done => {
    browser.assert.text(
      '#detailTitle',
      'Select a book to see its details and comments'
    )
    // To access ids with leading numeric characters, they must be prepended with \\3, and appended by a whitespace in the selector string.
    browser.click('#\\30 ', () => {
      const titleAndId = /^[\w\s]+\(id: \w+\)$/

      assert.match(browser.text('#detailTitle'), titleAndId)
      browser.assert.element('#newCommentForm')

      done()
    })
  })

  function getLiCount() {
    return Array.from(browser.querySelector('#detailComments').children).filter(
      node => node.tagName === 'LI'
    ).length
  }
  test('3. add comment after clicking li', done => {
    const comment = 'I LOVE THIS BOOK',
      liCountBefore = getLiCount()

    browser.assert.elements('#commentToAdd', '#addComment')

    browser.fill('#commentToAdd', comment)
    browser.pressButton('#addComment', () => {
      const liCountAfter = getLiCount()

      assert.strictEqual(liCountAfter, liCountBefore + 1)
      browser.assert.text(
        `#detailComments > li:nth-child(${liCountAfter})`,
        comment
      )

      done()
    })
  })

  test('4. delete book', done => {
    browser.assert.element('#deleteBook')
    browser.click('#deleteBook', () => {
      browser.assert.text('#bookDetail > p:first-child', 'Delete successful')

      done()
    })
  })

  test('5. delete all books', done => {
    browser.assert.element('#deleteAllBooks')
    browser.click('#deleteAllBooks', () => {
      browser.assert.elements(
        '#display li',
        0,
        'all bookItems in the display div should be removed'
      )

      done()
    })
  })
})
