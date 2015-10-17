/*
 * moan
 * http://neocotic.com/moan
 *
 * Copyright (c) 2015 Alasdair Mercer
 * Licensed under the MIT license.
 * https://github.com/neocotic/moan/blob/master/LICENSE.md
 */

'use strict'

const ESDoc = require('esdoc/out/src/ESDoc')
const publisher = require('esdoc/out/src/Publisher/publish')
const eslint = require('eslint')
const glob = require('glob')
const Mocha = require('mocha')
const path = require('path')

const moan = require('./lib/moan')

moan.task('default', 'test')

moan.task('docs', () => {
  let config = {
    source: 'lib',
    destination: 'docs'
  }

  ESDoc.generate(config, publisher)
})

moan.task('lint', () => {
  let cli = new eslint.CLIEngine()
  let report = cli.executeOnFiles([ 'lib/', 'test/', 'Moan.js' ])

  report.results.forEach((result) => {
    let filePath = path.relative(process.cwd(), result.filePath)

    moan.log.writeln(`Linting: ${filePath}`)

    result.messages.forEach((message) => {
      let output = `${filePath}: "${message.ruleId}" at line ${message.line} col ${message.column}: ${message.message}`

      if (message.severity === 2) {
        moan.log.error(output)
      } else if (message.severity === 1) {
        moan.log.warn(output)
      }
    })
  })

  if (report.errorCount > 0) {
    throw new Error(`${report.errorCount} lint errors were found`)
  }
})

moan.task('test', 'lint', () => {
  let mocha = new Mocha()
  let testFiles = glob.sync('test/**/*.spec.js')

  testFiles.forEach((testFile) => {
    moan.log.debug(`Adding file to test suite: ${path.relative(process.cwd(), testFile)}`)

    mocha.addFile(testFile)
  })

  return new Promise((resolve, reject) => {
    mocha.run((failures) => {
      if (failures > 0) {
        reject(new Error(`Failed to run ${failures} test${failures !== 1 ? 's' : ''}`))
      } else {
        resolve()
      }
    })
  })
})