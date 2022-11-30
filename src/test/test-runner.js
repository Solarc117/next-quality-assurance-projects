const Mocha = require('mocha'),
  fs = require('fs'),
  path = require('path'),
    mocha = new Mocha(),
    TEST_ANNEX = '.test.js'

for (const file of fs.readdirSync('./src/test/'))
  if (file.endsWith(TEST_ANNEX)) {
    mocha.addFile(path.join('./src/test/', file))
  }
// Should ensure tests are running on production code.
mocha.ui('tdd').run()
