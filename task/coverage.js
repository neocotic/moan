/*
 * moan
 * https://github.com/neocotic/moan
 *
 * Copyright (c) 2015 Alasdair Mercer
 * Licensed under the MIT license.
 * https://github.com/neocotic/moan/blob/master/LICENSE.md
 */

'use strict'

const moan = require('..')
const MochaRunner = require('./helper/MochaRunner')

module.exports = () => {
  process.env.ISTANBUL_REPORT_DIR = moan.config('coverageDir')
  process.env.ISTANBUL_REPORTERS = [ 'text-summary', 'html', 'lcovonly' ].join(',')

  let runner = new MochaRunner('instrumentedTestFiles', {
    reporter: 'mocha-istanbul'
  })

  return runner.run()
}