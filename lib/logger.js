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

const moanSymbol = Symbol('moan')
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
   * @public
   */
  constructor(moan) {
    /**
     * The {@link Moan} instance with which this {@link Logger} is associated.
     *
     * @private
     * @type {Moan}
     */
    this[moanSymbol] = moan
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
   * @param {boolean} [prependTask=true] - <code>true</code> to prepend task name to the log; otherwise
   * <code>false</code>
   * @return {Logger} A reference to this {@link Logger} for chaining purposes.
   * @public
   */
  debug(message, prependTask) {
    if (!this[moanSymbol].debug) return this

    return this[writelnSymbol](process.stdout, prependTask, chalk.blue('DEBUG'), Utils.asString(message))
  }

  /**
   * Logs the specified <code>message</code> prefixed with "ERROR" in red and followed by a new line to
   * <code>stderr</code>. If no <code>message</code> message is provided, this method will simply output "ERROR".
   *
   * If this method is called while a task is being executed by the associated {@link Moan} instance, then
   * <code>message</code> will be prefixed with the name of that task.
   *
   * @param {string} [message=""] - the error message to be logged
   * @param {boolean} [prependTask=true] - <code>true</code> to prepend task name to the log; otherwise
   * <code>false</code>
   * @return {Logger} A reference to this {@link Logger} for chaining purposes.
   * @public
   */
  error(message, prependTask) {
    return this[writelnSymbol](process.stderr, prependTask, chalk.red('ERROR'), Utils.asString(message))
  }

  /**
   * Logs the specified <code>message</code> prefixed with "OK" in green and followed by a new line to
   * <code>stdout</code>. If no <code>message</code> message is provided, this method will simply output "OK".
   *
   * If this method is called while a task is being executed by the associated {@link Moan} instance, then
   * <code>message</code> will be prefixed with the name of that task.
   *
   * @param {string} [message=""] - the positive message to be logged
   * @param {boolean} [prependTask=true] - <code>true</code> to prepend task name to the log; otherwise
   * <code>false</code>
   * @return {Logger} A reference to this {@link Logger} for chaining purposes.
   * @public
   */
  ok(message, prependTask) {
    return this[writelnSymbol](process.stdout, prependTask, chalk.green('OK'), Utils.asString(message))
  }

  /**
   * Logs the specified <code>message</code> prefixed with "WARNING" in yellow and followed by a new line to
   * <code>stdout</code>. If no <code>message</code> message is provided, this method will simply output "WARNING".
   *
   * If this method is called while a task is being executed by the associated {@link Moan} instance, then
   * <code>message</code> will be prefixed with the name of that task.
   *
   * @param {string} [message=""] - the warning message to be logged
   * @param {boolean} [prependTask=true] - <code>true</code> to prepend task name to the log; otherwise
   * <code>false</code>
   * @return {Logger} A reference to this {@link Logger} for chaining purposes.
   * @public
   */
  warn(message, prependTask) {
    return this[writelnSymbol](process.stdout, prependTask, chalk.yellow('WARNING'), Utils.asString(message))
  }

  /**
   * Logs the specified <code>message</code> to <code>stdout</code>.
   *
   * @param {string} [message=""] - the message to be logged
   * @return {Logger} A reference to this {@link Logger} for chaining purposes.
   * @public
   */
  write(message) {
    return this[writeSymbol](process.stdout, Utils.asString(message))
  }

  /**
   * Logs the specified <code>message</code> followed by a new line to <code>stdout</code>.
   *
   * If this method is called while a task is being executed by the associated {@link Moan} instance, then
   * <code>message</code> will be prefixed with the name of that task.
   *
   * @param {string} [message=""] - the message to be logged
   * @param {boolean} [prependTask=true] - <code>true</code> to prepend task name to the log; otherwise
   * <code>false</code>
   * @return {Logger} A reference to this {@link Logger} for chaining purposes.
   * @public
   */
  writeln(message, prependTask) {
    return this[writelnSymbol](process.stdout, prependTask, '', Utils.asString(message))
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
   * @param {boolean} [prependTask=true] - <code>true</code> to prepend task name to the log; otherwise
   * <code>false</code>
   * @param {string} prefix - the string to be prefix <code>message</code>
   * @param {string} message - the message to be written
   * @return {Logger} A reference to this {@link Logger} for chaining purposes.
   * @private
   */
  [writelnSymbol](stream, prependTask, prefix, message) {
    prependTask = prependTask != null ? !!prependTask : true

    let currentTask = prependTask && this[moanSymbol].currentTask
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