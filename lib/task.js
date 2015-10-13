/*
 * moan
 * http://neocotic.com/moan
 *
 * Copyright (c) 2015 Alasdair Mercer
 * Licensed under the MIT license.
 * https://github.com/neocotic/moan/blob/master/LICENSE.md
 */

'use strict'

const EventEmitter = require('events').EventEmitter

const Utils = require('./utils')

const createPromiseSymbol = Symbol('createPromise')
const promiseSymbol = Symbol('promise')

/**
 * TODO: Document
 */
module.exports = class Task extends EventEmitter {

  /**
   * Creates a new instance of {@link Task} with the specified <code>name</code> and with any optional
   * <code>dependencies</code> provided.
   *
   * It's <b>not</b> the responsibility of the {@link Task} to check when all of the <code>dependencies</code> have
   * completed before it can be run. This should be done by the calling code.
   *
   * @param {String} name - the name of the task
   * @param {String|String[]} [dependencies=[]] - a list of task names that the task depends on
   * @param {taskRunnable} runnable - the runnable function that performs the task operation
   */
  constructor(name, dependencies, runnable) {
    super()

    /**
     * The name of this {@link Task}.
     *
     * @type {String}
     */
    this.name = name

    /**
     * The names of other tasks on which this {@link Task} depends which will be empty if there are none.
     *
     * @type {String[]}
     */
    this.dependencies = Utils.asArray(dependencies)

    /**
     * The runnable function that performs the operation (synchronous or asynchronous) for this {@link Task}.
     *
     * @type {taskRunnable}
     */
    this.runnable = runnable

    /**
     * Whether the operation for this {@link Task} has completed.
     *
     * @type {Boolean}
     */
    this.completed = false

    /**
     * An error that was encountered during the operation for this {@link Task} that prevented it from completing.
     *
     * @type {*}
     */
    this.error = null

    /**
     * The result value produced by the operation for this {@link Task}.
     *
     * @type {*}
     */
    this.result = null
  }

  /**
   * Whether the operation for this {@link Task} failed to complete.
   *
   * @type {Boolean}
   */
  get failed() {
    return this.error != null
  }

  /**
   * Creates a <code>Promise</code> to wrap the execution of the {@link taskRunnable} for this {@link Task} which
   * attempts to support the various function signatures for synchronous or asynchronous operations.
   *
   * @returns {Promise} The created <code>Promise</code>.
   */
  [createPromiseSymbol]() {
    return new Promise((resolve, reject) => {
      if (this.runnable.length > 0) {
        this.runnable((error, value) => {
          if (error) {
            reject(error)
          } else {
            resolve(value)
          }
        })
      } else {
        let result = this.runnable()

        if (result != null && typeof result.then === 'function') {
          result.then(resolve, reject)
        } else {
          resolve(result)
        }
      }
    })
  }

  /**
   * Executes the operation for this {@link Task} and returns a <code>Promise</code> to track its completion or
   * failure.
   *
   * Regardless of whether the {@link taskRunnable} is synchronous or asynchronous, this function will always return a
   * a <code>Promise</code> to track its progress. Since tasks can only be executed once in their lifetime this
   * function can be called more than once but will always return the same <code>Promise</code>.
   *
   * @returns {Promise} The <code>Promise</code> for tracking the task operaton progress.
   */
  run() {
    if (!this[promiseSymbol]) {
      this[promiseSymbol] = this[createPromiseSymbol]()
        .then((value) => {
          this.completed = true
          this.result = value

          this.emit('completed')
        })
        .catch((error) => {
          this.error = error

          this.emit('failed', error)
        })
    }

    return this[promiseSymbol]
  }
}

/**
 * A function that performs the operation of a {@link Task} which is executed when {@link Task#run()} is invoked.
 *
 * If the function declares the any arguments, the first argument (i.e. <code>done</code>) will be treated as a
 * callback function which <b>must</b> be invoked to complete the task. This callback accepts two arguments itself
 * both of which are entirely optional and omitting them will simply complete the task without a result value. The
 * first is interpereted as an error which, when provided, will fail the task, and the second is an optional result
 * value for the task.
 *
 * However, the preferred approach to asynchronous tasks is to return a <i>thenable</i> (e.g. <code>Promise</code>).
 *
 * Obviously, these points only apply to asynchronous tasks and for synchronous tasks, simply don't declare any
 * arguments on <code>runable</code> or have it return a <i>thenable</i> (yuck!) object. Such tasks will simply
 * complete once the function has been invoked, and the return value will be used as the result value for the task.

 * @callback taskRunnable
 * @param {Function} [done] - a callback function to be invoked to complete an asynchronous task (only if declared)
 * @return {*|Promise} Either the result value for a synchronous task or a <i>thenable</i> to get the eventual result
 * of an asynchronous task. Nothing needs to be returned and any return value will be ignored if the <code>done</code>
 * callback function is used.
 */