/*
 * moan
 * https://github.com/neocotic/moan
 *
 * Copyright (c) 2015 Alasdair Mercer
 * Licensed under the MIT license.
 * https://github.com/neocotic/moan/blob/master/LICENSE.md
 */

'use strict'

const fs = require('fs')
const Instrumenter = require('istanbul').Instrumenter
const mkdirp = require('mkdirp-promise')
const ncp = require('ncp').ncp
const path = require('path')

const moan = require('../lib/moan')

function copyTests(from, to) {
  return new Promise((resolve, reject) => {
    ncp(from, path.join(to, from), (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}

module.exports = () => {
  // FIXME: Remove "sync" operations

  let directory = 'coverage'
  let instrumenter = new Instrumenter()

  return mkdirp(directory)
    .then(() => {
      return moan.fileSet('sourceFiles')
        .get()
    })
    .then((sourceFiles) => {
      let jobs = sourceFiles.map((sourceFile) => {
        moan.log.writeln(`Instrumenting file: ${path.normalize(sourceFile)}`)

        let input = fs.readFileSync(sourceFile, 'utf8')
        let inputFile = path.join(process.cwd(), sourceFile)
        let outputFile = path.join(process.cwd(), directory, sourceFile)
        let output = instrumenter.instrumentSync(input, inputFile)

        return mkdirp(path.dirname(outputFile))
          .then(() => {
            fs.writeFileSync(outputFile, output)
          })
      })

      return Promise.all(jobs)
    })
    .then(() => {
      return copyTests('test', directory)
    })
}