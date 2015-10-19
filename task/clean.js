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

function cleanDirectory(directoryPath) {
  moan.log.writeln(`Cleaning directory: ${directoryPath}`)

  return del(directoryPath)
}

module.exports = () => {
  let directories = [ 'coverage' ]
  let jobs = directories.map(cleanDirectory)

  return Promise.all(jobs)
}