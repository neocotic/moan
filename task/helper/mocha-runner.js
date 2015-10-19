/*
 * moan
 * https://github.com/neocotic/moan
 *
 * Copyright (c) 2015 Alasdair Mercer
 * Licensed under the MIT license.
 * https://github.com/neocotic/moan/blob/master/LICENSE.md
 */

'use strict'

const globby = require('globby')
const Mocha = require('mocha')
const path = require('path')

const moan = require('../../lib/moan')
const Utils = require('../../lib/utils')

const loadSuiteSymbol = Symbol('loadSuite')
const mochaSymbol = Symbol('mocha')
const patternsSymbol = Symbol('patterns')
const runSymbol = Symbol('run')

// TODO: complete

module.exports = class MochaRunner {

  constructor(patterns, options) {
    options = options || {}

    this[mochaSymbol] = new Mocha({
      reporter: options.reporter
    })

    this[patternsSymbol] = Utils.asArray(patterns)
  }

  [loadSuiteSymbol](files) {
    for (let file of files) {
      moan.log.debug(`Adding file to test suite: ${path.normalize(file)}`)

      this[mochaSymbol].addFile(file)
    }
  }

  run() {
    return globby(this[patternsSymbol])
      .then((files) => {
        this[loadSuiteSymbol](files)

        return this[runSymbol]()
      })
  }

  [runSymbol]() {
    return new Promise((resolve, reject) => {
      let files = this[mochaSymbol].files

      moan.log.writeln(`Running suite for ${files.length} test${Utils.plural(files.length)}...`)

      this[mochaSymbol].run((failures) => {
        if (failures > 0) {
          reject(new Error(`Failed to run ${failures} test${Utils.plural(failures)}`))
        } else {
          resolve()
        }
      })
    })
  }
}