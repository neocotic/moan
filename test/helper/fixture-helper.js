/*
 * moan
 * https://github.com/neocotic/moan
 *
 * Copyright (c) 2015 Alasdair Mercer
 * Licensed under the MIT license.
 * https://github.com/neocotic/moan/blob/master/LICENSE.md
 */

'use strict'

const ncp = require('ncp').ncp
const path = require('path')
const tmp = require('tmp')

const cleanUpsSymbol = Symbol('cleanUps')
const copyFixturesSymbol = Symbol('copyFixtures')
const createTempDirectorySymbol = Symbol('createTempDirectory')
const directorySymbol = Symbol('directory')

/**
 * TODO: Document
 *
 * @public
 */
module.exports = class FixtureHelper {

  /**
   * TODO: Document
   *
   * @param {string} [directory="test/fixtures"] -
   * @public
   */
  constructor(directory) {
    tmp.setGracefulCleanup()

    /**
     * TODO: Document
     *
     * @private
     * @type {Map<string, Function}
     */
    this[cleanUpsSymbol] = new Map()

    /**
     * TODO: Document
     *
     * @private
     * @type {string}
     */
    this[directorySymbol] = directory || path.join('test', 'fixtures')
  }

  /**
   * TODO: Document
   *
   * @param {string} [tempDirectory] -
   * @return {FixtureHelper}
   * @public
   */
  cleanUp(tempDirectory) {
    if (tempDirectory) {
      if (this[cleanUpsSymbol].has(tempDirectory)) {
        this[cleanUpsSymbol].get(tempDirectory).call()
        this[cleanUpsSymbol].delete(tempDirectory)
      }
    } else {
      for (let cleanUp of this[cleanUpsSymbol].values()) {
        cleanUp()
      }

      this[cleanUpsSymbol].clear()
    }

    return this
  }

  /**
   * TODO: Document
   *
   * @return {Promise}
   * @public
   */
  copy() {
    return this[createTempDirectorySymbol]()
      .then(this[copyFixturesSymbol].bind(this))
  }

  /**
   * TODO: Document
   *
   * @param {string} tempDirectory -
   * @return {Promise}
   * @private
   */
  [copyFixturesSymbol](tempDirectory) {
    return new Promise((resolve, reject) => {
      ncp(tempDirectory, this[directorySymbol], (error) => {
        if (error) {
          reject(error)
        } else {
          resolve(tempDirectory)
        }
      })
    })
  }

  /**
   * TODO: Document
   *
   * @return {Promise}
   * @private
   */
  [createTempDirectorySymbol]() {
    return new Promise((resolve, reject) => {
      tmp.dir({ unsafeCleanup: true }, (error, tempDirectory, cleanUp) => {
        if (error) {
          reject(error)
        } else {
          this[cleanUpsSymbol].set(tempDirectory, cleanUp)

          resolve(tempDirectory)
        }
      })
    })
  }
}