/*
 * moan
 * https://github.com/neocotic/moan
 *
 * Copyright (c) 2015 Alasdair Mercer
 * Licensed under the MIT license.
 * https://github.com/neocotic/moan/blob/master/LICENSE.md
 */

'use strict'

const chalk = require('chalk')

const Utils = require('./utils')

const errSymbol = Symbol('err')
const moanSymbol = Symbol('moan')
const outSymbol = Symbol('out')
const writeSymbol = Symbol('write')
const writelnSymbol = Symbol('writeln')

/**
 * Logs messages for a specific {@link Moan} instance to the standard streams.
 *
 * @public
 */
module.exports = class Logger {

  /**
   * Creates an instance of {@link Logger} for the specified <code>moan</code> instance.
   *
   * @param {Moan} moan - the {@link Moan} instance for which the {@link Logger} will be used
   * @param {Object} [options] - the options to be used
   * @param {Writable} [options.err=process.stderr] - the stream to which error messages are to be written
   * @param {Writable} [options.out=process.stdout] - the stream to whcih output messages are to be written
   * @public
   */
  constructor(moan, options) {
    options = options || {}

    /**
     * The stream to which this {@link Logger} writes error messages.
     *
     * @private
     * @type {Writable}
     */
    this[errSymbol] = options.err || process.stderr

    /**
     * The {@link Moan} instance with which this {@link Logger} is associated.
     *
     * @private
     * @type {Moan}
     */
    this[moanSymbol] = moan

    /**
     * The stream to which this {@link Logger} writes output messages.
     *
     * @private
     * @type {Writable}
     */
    this[outSymbol] = options.out || process.stdout
  }

  /**
   * Logs the specified <code>message</code> prefixed with "DEBUG" in blue and followed by a new line to
   * <code>stdout</code> but only when debug mode is enabled. If no <code>message</code> message is provided, this
   * method will simply output "DEBUG".
   *
   * If this method is called while a task is being executed by the associated {@link Moan} instance, then
   * <code>message</code> will be prefixed with the name of that task.
   *
   * @param {string} [message=""] - the debug message to be logged
   * @return {Logger} A reference to this {@link Logger} for chaining purposes.
   * @public
   */
  debug(message) {
    if (!this[moanSymbol].debug) {
      return this
    }

    return this[writelnSymbol](this[outSymbol], chalk.blue('DEBUG'), Utils.asString(message))
  }

  /**
   * Logs the specified <code>message</code> prefixed with "ERROR" in red and followed by a new line to
   * <code>stderr</code>. If no <code>message</code> message is provided, this method will simply output "ERROR".
   *
   * If this method is called while a task is being executed by the associated {@link Moan} instance, then
   * <code>message</code> will be prefixed with the name of that task.
   *
   * @param {string} [message=""] - the error message to be logged
   * @return {Logger} A reference to this {@link Logger} for chaining purposes.
   * @public
   */
  error(message) {
    return this[writelnSymbol](this[errSymbol], chalk.red('ERROR'), Utils.asString(message))
  }

  /**
   * Logs the specified <code>message</code> prefixed with "OK" in green and followed by a new line to
   * <code>stdout</code>. If no <code>message</code> message is provided, this method will simply output "OK".
   *
   * If this method is called while a task is being executed by the associated {@link Moan} instance, then
   * <code>message</code> will be prefixed with the name of that task.
   *
   * @param {string} [message=""] - the positive message to be logged
   * @return {Logger} A reference to this {@link Logger} for chaining purposes.
   * @public
   */
  ok(message) {
    return this[writelnSymbol](this[outSymbol], chalk.green('OK'), Utils.asString(message))
  }

  /**
   * Logs the specified <code>message</code> prefixed with "WARNING" in yellow and followed by a new line to
   * <code>stdout</code>. If no <code>message</code> message is provided, this method will simply output "WARNING".
   *
   * If this method is called while a task is being executed by the associated {@link Moan} instance, then
   * <code>message</code> will be prefixed with the name of that task.
   *
   * @param {string} [message=""] - the warning message to be logged
   * @return {Logger} A reference to this {@link Logger} for chaining purposes.
   * @public
   */
  warn(message) {
    return this[writelnSymbol](this[outSymbol], chalk.yellow('WARNING'), Utils.asString(message))
  }

  /**
   * Logs the specified <code>message</code> to <code>stdout</code>.
   *
   * @param {string} [message=""] - the message to be logged
   * @return {Logger} A reference to this {@link Logger} for chaining purposes.
   * @public
   */
  write(message) {
    return this[writeSymbol](this[outSymbol], Utils.asString(message))
  }

  /**
   * Logs the specified <code>message</code> followed by a new line to <code>stdout</code>.
   *
   * If this method is called while a task is being executed by the associated {@link Moan} instance, then
   * <code>message</code> will be prefixed with the name of that task.
   *
   * @param {string} [message=""] - the message to be logged
   * @return {Logger} A reference to this {@link Logger} for chaining purposes.
   * @public
   */
  writeln(message) {
    return this[writelnSymbol](this[outSymbol], '', Utils.asString(message))
  }

  /**
   * Writes the specified <code>message</code> to the <code>stream</code> provided.
   *
   * @param {Writable} stream - the writable stream to which <code>message</code> is to be written
   * @param {string} message - the message to be written
   * @return {Logger} A reference to this {@link Logger} for chaining purposes.
   * @private
   */
  [writeSymbol](stream, message) {
    if (!(chalk.supportsColor && this[moanSymbol].color)) {
      message = chalk.stripColor(message)
    }

    stream.write(message)

    return this
  }

  /**
   * Writes the specified <code>message</code> followed by a new line to the <code>stream</code> provided.
   *
   * If this method is called while a task is being executed by the associated {@link Moan} instance, then
   * <code>message</code> will be prefixed with the name of that task.
   *
   * @param {Writable} stream - the writable stream to which <code>message</code> is to be written
   * @param {string} prefix - the string to be prefix <code>message</code>
   * @param {string} message - the message to be written
   * @return {Logger} A reference to this {@link Logger} for chaining purposes.
   * @private
   */
  [writelnSymbol](stream, prefix, message) {
    let currentTask = this[moanSymbol].currentTask
    let task = currentTask ? chalk.inverse(`[${currentTask}]`) : ''
    if (task && prefix) {
      task += ' '
    }
    if ((task || prefix) && message) {
      message = ` ${message}`
    }

    return this[writeSymbol](stream, `${task}${prefix}${message}\n`)
  }
}