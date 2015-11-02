/*
 * moan
 * https://github.com/neocotic/moan
 *
 * Copyright (c) 2015 Alasdair Mercer
 * Licensed under the MIT license.
 * https://github.com/neocotic/moan/blob/master/LICENSE.md
 */

'use strict'

const EventEmitter = require('events').EventEmitter

const Utils = require('./Utils')

const createPromiseSymbol = Symbol('createPromise')
const dependenciesSymbol = Symbol('dependencies')
const errorSymbol = Symbol('error')
const finishedSymbol = Symbol('finished')
const nameSymbol = Symbol('name')
const promiseSymbol = Symbol('promise')
const resultSymbol = Symbol('result')
const runnableSymbol = Symbol('runnable')
const startedSymbol = Symbol('started')

/**
 * A simple task operation which can be synchronous or asynchronous, entirely depending on how the {@link taskRunnable}
 * has been implemented.
 *
 * A task can declare that it depends on the completion other tasks, however, it's the responsibility of the calling
 * code to ensure that its dependencies are executed prior to executing the task.
 *
 * @access public
 */
class Task extends EventEmitter {

  /**
   * Creates a new instance of {@link Task} with the specified <code>name</code> and with any optional
   * <code>dependencies</code> provided.
   *
   * It's <b>not</b> the responsibility of the {@link Task} to check when all of the <code>dependencies</code> have
   * completed before it can be run. This should be done by the calling code.
   *
   * A no-operation function will be used if <code>runnable</code> is not provided (or not a function).
   *
   * @param {string} name - the name of the task
   * @param {string|string[]} [dependencies=[]] - a list of task names that the task depends on
   * @param {taskRunnable} [runnable] - the runnable function that performs the task operation
   * @access public
   */
  constructor(name, dependencies, runnable) {
    super()

    if (typeof dependencies === 'function') {
      runnable = dependencies
      dependencies = null
    }

    /**
     * The name of this {@link Task}.
     *
     * @access private
     * @type {string}
     */
    this[nameSymbol] = name

    /**
     * The names of other tasks on which this {@link Task} depends which will be empty if there are none.
     *
     * @access private
     * @type {string[]}
     */
    this[dependenciesSymbol] = Utils.asArray(dependencies)

    /**
     * The runnable function that performs the operation (synchronous or asynchronous) for this {@link Task}.
     *
     * @access private
     * @type {taskRunnable}
     */
    this[runnableSymbol] = typeof runnable === 'function' ? runnable : () => {}

    /**
     * An error that was encountered during the operation for this {@link Task} that prevented it from completing.
     *
     * @access private
     * @type {*}
     */
    this[errorSymbol] = null

    /**
     * Whether the operation for this {@link Task} has finished, regardless of whether it was successful.
     *
     * @access private
     * @type {boolean}
     */
    this[finishedSymbol] = false

    /**
     * The result value produced by the operation for this {@link Task}.
     *
     * @access private
     * @type {*}
     */
    this[resultSymbol] = null

    /**
     * Whether the operation for this {@link Task} has started.
     *
     * @access private
     * @type {boolean}
     */
    this[startedSymbol] = false
  }

  /**
   * Creates a <code>Promise</code> to wrap the execution of the {@link taskRunnable} for this {@link Task} which
   * attempts to support the various method signatures for synchronous or asynchronous operations.
   *
   * @return {Promise} The created <code>Promise</code>.
   * @access private
   */
  [createPromiseSymbol]() {
    return new Promise((resolve, reject) => {
      if (this[runnableSymbol].length > 0) {
        this[runnableSymbol]((error, value) => {
          if (error) {
            reject(error)
          } else {
            resolve(value)
          }
        })
      } else {
        let result = this[runnableSymbol]()

        if (result != null && typeof result.then === 'function') {
          result.then(resolve, reject)
        } else {
          resolve(result)
        }
      }
    })
  }

  /**
   * The names of other tasks on which this {@link Task} depends which will be empty if there are none.
   *
   * @example
   * moan.task('build', [ 'compile', 'test' ])
   * moan.task('compile', () => { ... })
   * moan.task('lint', () => { ... })
   * moan.task('test', 'lint', () => { ... })
   *
   * moan.task('buid').dependencies
   * //=> [ "compile", "test" ]
   * moan.task('compile').dependencies
   * //=> []
   * moan.task('lint').dependencies
   * //=> []
   * moan.task('test').dependencies
   * //=> [ "lint" ]
   * @access public
   * @type {string[]}
   */
  get dependencies() {
    return this[dependenciesSymbol].slice()
  }

  /**
   * An error that was encountered during the operation for this {@link Task} that prevented it from completing.
   *
   * @access public
   * @type {*}
   */
  get error() {
    return this[errorSymbol]
  }

  /**
   * Whether the operation for this {@link Task} failed to complete.
   *
   * This is a convenient shorthand for checking whether {@link Task#error} is not <code>null</code>. This will be
   * <code>false</code> if this {@link Task} has not even been ran so it's recommended that it is used in conjunction
   * with {@link Task#finished}.
   *
   * @example
   * moan.task('compile', () => {
   *   throw new Error('Oh snap!')
   * })
   *
   * function taskHandler() {
   *   moan.task('compile').failed
   *   //=> true
   * }
   *
   * moan.run('compile')
   *   .then(taskHandler)
   *   .catch(taskHandler)
   * @access public
   * @type {boolean}
   */
  get failed() {
    return this[errorSymbol] != null
  }

  /**
   * Whether the operation for this {@link Task} has finished, regardless of whether it was successful.
   *
   * In order to check if it passed successfully combine with {@link Task#failed}.
   *
   * @example
   * moan.task('compile', () => { ... })
   *
   * function taskHandler() {
   *   moan.task('compile').finished
   *   //=> true
   * }
   *
   * moan.run('compile')
   *   .then(taskHandler)
   *   .catch(taskHandler)
   * @access public
   * @type {boolean}
   */
  get finished() {
    return this[finishedSymbol]
  }

  /**
   * The name of this {@link Task}.
   *
   * @access public
   * @type {string}
   */
  get name() {
    return this[nameSymbol]
  }

  /**
   * The result value produced by the operation for this {@link Task}.
   *
   * It's important to note that tasks are not required to provide a result so don't always expect this to be anything.
   * Also, if this is referenced within another task, that task should declare a dependency on this {@link Task} so
   * that it's executed beforehand, otherwise referencing this will throw an error. Another - less elegant - solution
   * is to invoke this {@link Task#run} within the current task and then reference this result once it's completed.
   *
   * @example
   * moan.task('deploy', 'version', () => {
   *   let version = moan.task('version').result
   *
   *   return paas.deploy(version)
   * })
   * moan.task('version', () => {
   *   let version = require('./package.json').version
   *
   *   return new Promise((resolve, reject) => {
   *     child_process.spawn('git', [ 'tag', version ])
   *       .on('close', (code) => {
   *         if (!code) {
   *           resolve(version)
   *         } else {
   *           reject(new Error(`Could not tag version: ${version}`))
   *         }
   *       })
   *   })
   * })
   * @throws {Error} If this {@link Task} has not finished running.
   * @access public
   * @type {*}
   */
  get result() {
    if (!this[finishedSymbol]) {
      throw new Error(`Task has not executed: ${this[nameSymbol]}`)
    }

    return this[resultSymbol]
  }

  /**
   * Executes the operation for this {@link Task} and returns a <code>Promise</code> to track its completion or
   * failure.
   *
   * Regardless of whether the {@link taskRunnable} is synchronous or asynchronous, this method will always return a
   * <code>Promise</code> to track its progress. Since tasks can only be executed once in their lifetime this method
   * can be called more than once but will always return the same <code>Promise</code>.
   *
   * @return {Promise} The <code>Promise</code> for tracking the task operaton progress.
   * @access public
   */
  run() {
    if (!this[promiseSymbol]) {
      this[startedSymbol] = true

      this.emit('start')

      this[promiseSymbol] = this[createPromiseSymbol]()
        .then((value) => {
          this[finishedSymbol] = true
          this[resultSymbol] = value

          this.emit('done', value)

          return value
        })
        .catch((error) => {
          this[finishedSymbol] = true
          this[errorSymbol] = error

          this.emit('error', error)

          return Promise.reject(error)
        })
    }

    return this[promiseSymbol]
  }

  /**
   * The runnable function that performs the operation (synchronous or asynchronous) for this {@link Task}.
   *
   * @access public
   * @type {taskRunnable}
   */
  get runnable() {
    return this[runnableSymbol]
  }

  /**
   * Whether the operation for this {@link Task} has started.
   *
   * This will remain <code>true</code> even if this {@link Task} has finished. In order to check if it is still in
   * progress combine with {@link Task#finished}.
   *
   * @example
   * moan.task('build', [ 'compile', 'test' ])
   * moan.task('compile', () => { ... })
   * moan.task('lint', () => { ... })
   * moan.task('test', 'lint', () => { ... })
   *
   * moan.run('build')
   *
   * moan.task('compile').started
   * //=> true
   * moan.task('build').started
   * //=> false
   * @access public
   * @type {boolean}
   */
  get started() {
    return this[startedSymbol]
  }
}

module.exports = Task

/**
 * A function that performs the operation of a {@link Task} which is executed when {@link Task#run()} is invoked.
 *
 * If the function declares any arguments, the first argument (i.e. <code>done</code>) will be treated as a callback
 * function which <b>must</b> be invoked to complete the task. This callback accepts two arguments itself both of which
 * are entirely optional and omitting them will simply complete the task without a result value. The first is
 * interpereted as an error which, when provided, will fail the task, and the second is an optional result value for
 * the task.
 *
 * However, the preferred approach to asynchronous tasks is to return a <i>thenable</i> (e.g. <code>Promise</code>).
 *
 * Obviously, these points only apply to asynchronous tasks and for synchronous tasks, simply don't declare any
 * arguments on <code>runable</code> or have it return a <i>thenable</i> (yuck!) object. Such tasks will simply
 * complete once the function has been invoked, and the return value will be used as the result value for the task.

 * @callback taskRunnable
 * @param {Function} [done] - a callback function to be invoked to complete an asynchronous task (only if declared)
 * @return {Promise|*} Either a <i>thenable</i> to get the eventual result of an asynchronous task or the result value
 * for a synchronous task. Nothing needs to be returned and any return value will be ignored if the <code>done</code>
 * callback function is used.
 */