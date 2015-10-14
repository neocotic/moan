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

const Task = require('./task')
const Utils = require('./utils')

const getTaskSymbol = Symbol('getTask')
const registerTaskSymbol = Symbol('registerTask')
const runTaskSymbol = Symbol('runTask')
const runTasksSymbol = Symbol('runTasks')
const taskStackSymbol = Symbol('taskStack')
const tasksSymbol = Symbol('tasks')

/**
 * TODO: Document
 *
 * @public
 */
class Moan extends EventEmitter {

  /**
   * Creates a new instance of {@link Moan} with no registered tasks.
   *
   * @public
   */
  constructor() {
    super()

    /**
     * The current stack of tasks being executed.
     *
     * @private
     * @type {string[]}
     */
    this[taskStackSymbol] = []

    /**
     * A map of registered {@link Task} instances.
     *
     * @private
     * @type {Map<string, Task>}
     */
    this[tasksSymbol] = new Map()
  }

  /**
   * The name of the task currently being executed.
   *
   * @public
   * @type {string}
   */
  get currentTask() {
    return this[taskStackSymbol][this[taskStackSymbol].length - 1]
  }

  /**
   * Returns a list of names for tasks for which the task with the specified <code>name</code> depends on.
   *
   * @example
   * moan.task('build', ['compile', 'test'], () => { ... })
   * moan.task('compile', () => { ... })
   * moan.task('lint', () => { ... })
   * moan.task('test', 'lint', () => { ... })
   *
   * moan.dependencies('buid')
   * //=> ["compile", "test"]
   * moan.dependencies('compile')
   * //=> []
   * moan.dependencies('lint')
   * //=> []
   * moan.dependencies('test')
   * //=> ["lint"]
   * @param {string} name - the name of the task whose dependencies are to be returned
   * @return {string[]} An array of task names on which the named task depends which will be empty if it has no
   * dependencies.
   * @throws {Error} If no task could be found for the given <code>name</code>.
   * @public
   */
  dependencies(name) {
    let task = this[getTaskSymbol](name)

    return task.dependencies.slice()
  }

  /**
   * Returns the {@link Task} with the specified <code>name</code> or throws an error if none could be found.
   *
   * @param {string} name - the name of the {@link Task} to be returned
   * @throws {Error} If no {@link Task} can be found for the given <code>name</code>.
   * @private
   */
  [getTaskSymbol](name) {
    let task = this[tasksSymbol].get(name)
    if (!task) throw new Error(`Could not find task: ${name}`)

    return task
  }

  /**
   * Returns whether the task with the specified <code>name</code> completed successfully.
   *
   * @param {string} name - the name of the task to be checked
   * @return {boolean} <code>true</code> if the named task has ran and completed successfully; otherwise
   * <code>false</code>.
   * @throws {Error} If no task could be found for the given <code>name</code>.
   * @public
   */
  isComplete(name) {
    let task = this[getTaskSymbol](name)

    return task.completed
  }

  /**
   * Returns whether the task with the specified <code>name</code> failed.
   *
   * @param {string} name - the name of the task to be checked
   * @return {boolean} <code>true</code> if the named task has ran but failed to complete; otherwise
   * <code>false</code>.
   * @throws {Error} If no task could be found for the given <code>name</code>.
   * @public
   */
  isFail(name) {
    let task = this[getTaskSymbol](name)

    return task.failed
  }

  /**
   * Returns a list of names for tasks that have been registered.
   *
   * @return {string[]} An array of registered task names which will be empty if none exist.
   * @public
   */
  names() {
    return Array.from(this[tasksSymbol].keys())
  }

  /**
   * TODO: Document
   *
   * @param {Task} task -
   * @private
   */
  [registerTaskSymbol](task) {
    this[tasksSymbol][task.name] = task

    task
      .on('completed', (value) => {
        this.emit('task', value, task.name)
      })
      .on('failed', (error) => {
        this.emit('error', error, task.name)
      })
  }

  /**
   * TODO: Document
   *
   * @param {string|string[]} [names] -
   * @return {Promise}
   * @throws {Error} If a task could not be found any of the given <code>names</code> or there is a cyclic dependency.
   * @public
   */
  run(names) {
    names = Utils.asArray(names)
    if (names.length === 0) {
      names.push('default')
    }

    return this[runTasksSymbol](names)
  }

  /**
   * TODO: Document
   *
   * @param {Task} task -
   * @return {Promise}
   * @throws {Error} If there is a cyclic dependency.
   * @private
   */
  [runTaskSymbol](task) {
    if (this[taskStackSymbol].includes(task.name)) {
      throw new Error(`Cyclic dependency found: ${task.name}`)
    }

    let prerequisite = task.dependencies.length > 0 ? this[runTasksSymbol](task.dependencies) : Promise.resolve()

    return prerequisite
      .then(() => {
        this[taskStackSymbol].push(task.name)

        return task.run()
      })
      .then((result) => {
        this[taskStackSymbol].pop()

        return result
      })
  }

  /**
   * TODO: Document
   *
   * @param {string[]} names -
   * @return {Promise}
   * @throws {Error} If a task could not be found any of the given <code>names</code> or there is a cyclic dependency.
   * @private
   */
  [runTasksSymbol](names) {
    return names
      .map((name) => this[getTaskSymbol](name))
      .reduce((promise, task) => {
        return promise
          .then(() => this[runTaskSymbol](task))
      }, Promise.resolve())
  }

  /**
   * TODO: Document
   *
   * @param {string} name -
   * @param {string|string[]} [dependencies=[]] -
   * @param {taskRunnable} runnable -
   * @return {Moan}
   * @public
   */
  task(name, dependencies, runnable) {
    if (typeof dependencies === 'function') {
      runnable = dependencies
      dependencies = null
    }

    let task = new Task(name, dependencies, runnable)
    this[registerTaskSymbol](task)

    return this
  }
}

module.exports = new Moan()
module.exports.Moan = Moan