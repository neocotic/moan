/*
 * moan
 * https://github.com/neocotic/moan
 *
 * Copyright (c) 2015 Alasdair Mercer
 * Licensed under the MIT license.
 * https://github.com/neocotic/moan/blob/master/LICENSE.md
 */

'use strict'

const Mocha = require('mocha')
const path = require('path')

const moan = require('../../lib/moan')
const Utils = require('../../lib/utils')

const fileSetSymbol = Symbol('fileSet')
const loadSuiteSymbol = Symbol('loadSuite')
const mochaSymbol = Symbol('mocha')
const runSymbol = Symbol('run')

/**
 * Runs a mocha test suite based on a {@link FileSet}.
 *
 * @public
 */
module.exports = class MochaRunner {

  /**
   * Creates a new instance of {@link MochaRunner} for test files identified <code>fileSet</code> provided.
   *
   * @param {string} fileSet - the ID of the {@link FileSet} for the test suite files
   * @param {Object} options - the options to be used
   * @param {string} options.reporter - the mocha reporter to be used
   * @public
   */
  constructor(fileSet, options) {
    /**
     * The {@link FileSet}} for identifying the test suite files.
     *
     * @private
     * @type {FileSet}
     */
    this[fileSetSymbol] = moan.fileSet(fileSet)

    /**
     * The <code>Mocha</code> instance.
     *
     * @private
     * @type {Mocha}
     */
    this[mochaSymbol] = new Mocha({
      reporter: options.reporter
    })
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
    return this[fileSetSymbol]
      .get()
      .then((files) => {
        this[loadSuiteSymbol](files)

        return this[runSymbol]()
      })
  }

  /**
   * Runs the full test suite and reports any failures.
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