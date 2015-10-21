/*
 * moan
 * https://github.com/neocotic/moan
 *
 * Copyright (c) 2015 Alasdair Mercer
 * Licensed under the MIT license.
 * https://github.com/neocotic/moan/blob/master/LICENSE.md
 */

'use strict'

const moan = require('../lib/moan')

module.exports = () => {
  let fileSets = [ 'istanbulFiles' ]
  let jobs = fileSets.map((id) => moan.fileSet(id).del())

  return Promise.all(jobs)
}