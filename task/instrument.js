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

const moan = require('..')

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

function instrument(instrumenter, sourceFile) {
  /* eslint "no-sync": 0 */
  moan.log.writeln(`Instrumenting file: ${path.normalize(sourceFile)}`)

  let directory = moan.config('coverageDir')
  let inputFile = path.join(process.cwd(), sourceFile)
  let outputFile = path.join(process.cwd(), directory, sourceFile)

  return mkdirp(path.dirname(outputFile))
    .then(() => readFile(inputFile))
    .then((input) => instrumenter.instrumentSync(input, inputFile))
    .then((output) => writeFile(outputFile, output))
}

function readFile(file) {
  let encoding = moan.config('encoding')

  return new Promise((resolve, reject) => {
    fs.readFile(file, encoding, (error, contents) => {
      if (error) {
        reject(error)
      } else {
        resolve(contents)
      }
    })
  })
}

function writeFile(file, contents) {
  return new Promise((resolve, reject) => {
    fs.writeFile(file, contents, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}

module.exports = () => {
  let directory = moan.config('coverageDir')
  let instrumenter = new Instrumenter()

  return mkdirp(directory)
    .then(() => moan.fileSet('sourceFiles').get())
    .then((sourceFiles) => {
      let jobs = sourceFiles.map((sourceFile) => instrument(instrumenter, sourceFile))

      return Promise.all(jobs)
    })
    .then(() => copyTests(moan.config('testDir'), directory))
}