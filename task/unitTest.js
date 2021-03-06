/*
 * moan
 * https://github.com/neocotic/moan
 *
 * Copyright (c) 2015 Alasdair Mercer
 * Licensed under the MIT license.
 * https://github.com/neocotic/moan/blob/master/LICENSE.md
 */

'use strict'

const MochaRunner = require('./helper/MochaRunner')

module.exports = () => {
  let runner = new MochaRunner('testFiles', {
    reporter: 'spec'
  })

  return runner.run()
}