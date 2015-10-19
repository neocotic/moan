/*
 * moan
 * https://github.com/neocotic/moan
 *
 * Copyright (c) 2015 Alasdair Mercer
 * Licensed under the MIT license.
 * https://github.com/neocotic/moan/blob/master/LICENSE.md
 */

'use strict'

const del = require('del')

const moan = require('../lib/moan')

function clean(filePath) {
  moan.log.writeln(`Cleaning: ${filePath}`)

  return del(filePath)
}

module.exports = () => {
  let patterns = [ 'coverage', 'html-report', 'lcov.info' ]

  return Promise.all(patterns.map(clean))
}