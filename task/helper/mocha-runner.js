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

/**
 * Runs a mocha test suite for based on a set of file patterns (globs).
 *
 * @public
 */
module.exports = class MochaRunner {

  /**
   * Creates a new instance of {@link MochaRunner} for test files identified by the glob <code>patterns</code>
   * provided.
   *
   * @param {string|string[]} patterns - the glob pattern to target the files for the test suite
   * @param {Object} options - the options to be used
   * @param {string} options.reporter - the mocha reporter to be used
   * @public
   */
  constructor(patterns, options) {
    this[mochaSymbol] = new Mocha({
      reporter: options.reporter
    })

    this[patternsSymbol] = Utils.asArray(patterns)
  }

  /**
   * Loads each of the specified <code>files</code> into this mocha test suite.
   *
   * @param {string[]} files - the test files to be loaded into the suite
   * @private
   */
  [loadSuiteSymbol](files) {
    for (let file of files) {
      moan.log.debug(`Adding file to test suite: ${path.normalize(file)}`)

      this[mochaSymbol].addFile(file)
    }
  }

  /**
   * Loads all test files into this suite and then runs them all for the configured reporter.
   *
   * @return {Promise} A <code>Promise</code> used to track the test suite execution.
   * @private
   */
  run() {
    return globby(this[patternsSymbol])
      .then((files) => {
        this[loadSuiteSymbol](files)

        return this[runSymbol]()
      })
  }

  /**
   * Runs the full test suite and reports any failure.
   *
   * @private {Promise} A <code>Promise</code> used to track the test suite execution.
   * @private
   */
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