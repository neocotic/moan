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

const Utils = require('./Utils')

const getSymbol = Symbol('get')
const optionsSymbol = Symbol('options')
const patternsSymbol = Symbol('patterns')

/**
 * A simple set of files which are not stored but, instead, identified by glob patterns and options and looked up as
 * and when required.
 *
 * This is ideal when mapped to a reference as this results in a better representation of file sets.
 *
 * @access public
 */
class FileSet extends EventEmitter {

  /**
   * Creates a new instance of {@link FileSet} based on the glob <code>patterns</code> and <code>options</code>
   * provided.
   *
   * @param {string|string[]} [patterns=[]] - the glob pattern(s) to be used to target the files in the set
   * @param {Object} [options={}] - the glob options to be used
   * @access public
   */
  constructor(patterns, options) {
    super()

    /**
     * The glob patterns for identifying the files in this {@link FileSet}.
     *
     * @access private
     * @type {string[]}
     */
    this[patternsSymbol] = Utils.asArray(patterns)

    /**
     * The glob options to be used when looking up the files in this {@link FileSet}.
     *
     * @access private
     * @type {Object}
     */
    this[optionsSymbol] = options || {}
  }

  /**
   * Deletes all files and/or directories that match this {@link FileSet} and provides their file paths.
   *
   * @return {Promise} A <code>Promise</code> used to track the deletion of all matching files and/or directories.
   * @access public
   */
  del() {
    return del(this[patternsSymbol], this[optionsSymbol])
      .then((files) => {
        this.emit('deleted', files)

        return files
      })
      .catch((error) => {
        this.emit('error', error)

        return Promise.reject(error)
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
   * @access public
   */
  expand(patterns, options) {
    patterns = this[patternsSymbol].concat(Utils.asArray(patterns))
    options = Object.assign({}, this[optionsSymbol], options)

    return new FileSet(patterns, options)
  }

  /**
   * Finds the first file or directory that matches this {@link FileSet} and provides its file path.
   *
   * For now, this is simply a convenience method that returns the first file path after finding them all. In the
   * future, however, this may be optimized to stop searching for other files after the one is foud.
   *
   * @return {Promise} A <code>Promise</code> used to track the lookup of the first matching file or directory.
   * @access public
   */
  first() {
    return this[getSymbol](true)
      .then((files) => {
        let file = files[0]

        this.emit('found', [ file ])

        return file
      })
  }

  /**
   * Finds all files and/or directories that match this {@link FileSet} and provides their file paths.
   *
   * @return {Promise} A <code>Promise</code> used to track the lookup of all matching files and/or directories.
   * @access public
   */
  get() {
    return this[getSymbol]()
  }

  /**
   * Finds all files and/or directories that match this {@link FileSet} and provides their file paths with the option
   * to silence events that are emitted internally.
   *
   * This method is used by others to improve code re-use and avoid duplication.
   *
   * @param {boolean} [silenceFoundEvent=false] - <code>true</code> to prevent this method from emitting the "found"
   * event; otherwise <code>false</code>
   * @return {Promise} A <code>Promise</code> used to track the lookup of all matching files and/or directories.
   * @access private
   */
  [getSymbol](silenceFoundEvent) {
    return globby(this[patternsSymbol], this[optionsSymbol])
      .then((files) => {
        if (!silenceFoundEvent) {
          this.emit('found', files)
        }

        return files
      })
      .catch((error) => {
        this.emit('error', error)

        return Promise.reject(error)
      })
  }

  /**
   * Finds the last file or directory that matches this {@link FileSet} and provides its file path.
   *
   * @return {Promise} A <code>Promise</code> used to track the lookup of the last matching file or directory.
   * @access public
   */
  last() {
    return this[getSymbol](true)
      .then((files) => {
        let file = files[files.length - 1]

        this.emit('found', [ file ])

        return file
      })
  }

  /**
   * The glob patterns used by this {@link FileSet}.
   *
   * @access public
   * @type {string[]}
   */
  get patterns() {
    return Array.from(this[patternsSymbol])
  }
}

module.exports = FileSet