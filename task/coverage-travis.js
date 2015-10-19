/*
 * moan
 * https://github.com/neocotic/moan
 *
 * Copyright (c) 2015 Alasdair Mercer
 * Licensed under the MIT license.
 * https://github.com/neocotic/moan/blob/master/LICENSE.md
 */

'use strict'

const MochaRunner = require('./helper/mocha-runner')

module.exports = () => {
  let runner = new MochaRunner('coverage/test/**/*.spec.js', {
    reporter: 'travis-cov'
  })

  return runner.run()
}