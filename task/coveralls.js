/*
 * moan
 * https://github.com/neocotic/moan
 *
 * Copyright (c) 2015 Alasdair Mercer
 * Licensed under the MIT license.
 * https://github.com/neocotic/moan/blob/master/LICENSE.md
 */

'use strict'

const coveralls = require('coveralls')
const fs = require('fs')

const moan = require('../lib/moan')

function readLineCoverage() {
  let encoding = moan.config('encoding')
  let file = moan.config('lineCoverageFile')

  return new Promise((resolve, reject) => {
    fs.readFile(file, encoding, (error, data) => {
      if (error) {
        reject(error)
      } else {
        resolve(data)
      }
    })
  })
}

function sendCoverage(lineCoverage) {
  return new Promise((resolve, reject) => {
    coveralls.handleInput(lineCoverage, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}

module.exports = () => {
  return readLineCoverage()
    .then(sendCoverage)
}