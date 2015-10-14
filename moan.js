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

const moan = require('./lib/moan')

moan.task('docs', () => {
  let config = {
    source: 'lib',
    destination: 'docs'
  }

  ESDoc.generate(config, publisher)
})

moan.task('lint', () => {
  let cli = new eslint.CLIEngine()
  let report = cli.executeOnFiles([ 'bin/moan', 'lib/', 'test/', 'moan.js' ])

  report.results.forEach((result) => {
    result.messages.forEach((message) => {
      const output = `[${message.ruleId}] at line ${message.line} col ${message.column}: ${message.message}`

      if (message.severity === 2) {
        console.error(`error: ${output}`)
      } else if (message.severity === 1) {
        console.warn(`warning: ${output}`)
      }
    })
  })

  if (report.errorCount > 0) {
    throw new Error(`error: ${report.errorCount} lint errors were found`)
  }
})

moan.task('test', 'lint', () => {
  // TODO
})