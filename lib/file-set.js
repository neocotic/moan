/*
 * moan
 * https://github.com/neocotic/moan
 *
 * Copyright (c) 2015 Alasdair Mercer
 * Licensed under the MIT license.
 * https://github.com/neocotic/moan/blob/master/LICENSE.md
 */

'use strict'

const del = require('del')
const EventEmitter = require('events').EventEmitter
const globby = require('globby')

const Utils = require('./utils')

const optionsSymbol = Symbol('options')
const patternsSymbol = Symbol('patterns')

/**
 * A simple set of files which are not stored but, instead, identified by glob patterns and options and looked up as
 * and when required.
 *
 * This is ideal when mapped to a reference as this results in a better representation of file sets.
 *
 * @public
 */
module.exports = class FileSet extends EventEmitter {

  /**
   * Creates a new instance of {@link FileSet} based on the glob <code>patterns</code> and <code>options</code>
   * provided.
   *
   * @param {string|string[]} [patterns=[]] - the glob pattern(s) to be used to target the files in the set
   * @param {Object} [options={}] - the glob options to be used
   * @public
   */
  constructor(patterns, options) {
    super()

    /**
     * The glob patterns for identifying the files in this {@link FileSet}.
     *
     * @private
     * @type {string[]}
     */
    this[patternsSymbol] = Utils.asArray(patterns)

    /**
     * The glob options to be used when looking up the files in this {@link FileSet}.
     *
     * @private
     * @type {Object}
     */
    this[optionsSymbol] = options || {}
  }

  /**
   * Deletes all files and/or directories that match this {@link FileSet} and provides their file paths.
   *
   * @return {Promise} A <code>Promise</code> used to track the deletion of all matching files and/or directories.
   * @public
   */
  del() {
    return del(this[patternsSymbol], this[optionsSymbol])
      .then((files) => {
        this.emit('deleted', files)

        return files
      })
  }

  /**
   * Extends the glob <code>patterns</code> and <code>options</code> of this {@link FileSet} with those provided and
   * creates and returns a new {@link FileSet} based on the result.
   *
   * @param {string|string[]} [patterns=[]] - the glob pattern(s) to extend those used by this {@link FileSet}
   * @param {Object} [options={}] - the glob options to extend those used by this {@link FileSet}
   * @return {FileSet} A {@link FileSet} containing glob patterns and options which resulted in merging those of this
   * {@link FileSet} and those provided.
   * @public
   */
  expand(patterns, options) {
    patterns = this[patternsSymbol].concat(Utils.asArray(patterns))
    options = Object.assign({}, this[optionsSymbol], options)

    return new FileSet(patterns, options)
  }

  /**
   * Finds all files and/or directories that match this {@link FileSet} and provides their file paths.
   *
   * @return {Promise} A <code>Promise</code> used to track the lookup of all matching files and/or directories.
   * @public
   */
  get() {
    return globby(this[patternsSymbol], this[optionsSymbol])
      .then((files) => {
        this.emit('found', files)

        return files
      })
  }

  /**
   * The glob patterns used by this {@link FileSet}.
   *
   * @public
   * @type {string[]}
   */
  get patterns() {
    return Array.from(this[patternsSymbol])
  }
}