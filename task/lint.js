/*
 * moan
 * https://github.com/neocotic/moan
 *
 * Copyright (c) 2015 Alasdair Mercer
 * Licensed under the MIT license.
 * https://github.com/neocotic/moan/blob/master/LICENSE.md
 */

'use strict'

const CLIEngine = require('eslint').CLIEngine
const path = require('path')

const moan = require('..')

module.exports = () => {
  return moan.fileSet('lintFiles')
    .get()
    .then((lintFiles) => {
      let engine = new CLIEngine()
      let report = engine.executeOnFiles(lintFiles)

      for (let result of report.results) {
        let filePath = path.relative(process.cwd(), result.filePath)

        moan.log.writeln(`Linting file: ${filePath}`)

        for (let message of result.messages) {
          let output = `"${message.ruleId}" at line ${message.line} col ${message.column}: ${message.message}`

          if (message.severity === 2) {
            moan.log.error(output)
          } else if (message.severity === 1) {
            moan.log.warn(output)
          }
        }
      }

      if (report.errorCount > 0) {
        throw new Error(`${report.errorCount} lint errors were found`)
      }
    })
}