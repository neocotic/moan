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

const registerTaskSymbol = Symbol('registerTask')
const tasksSymbol = Symbol('tasks')

/**
 * TODO: Document
 */
module.exports = class Moan extends EventEmitter {

  /**
   * TODO: Document
   */
  constructor() {
    super()

    this[tasksSymbol] = new Map()
  }

  /**
   * Returns a list of names for tasks for which the task with the specified <code>name</code> depends on.
   *
   * @param {String} name - the name of the task whose dependencies are to be returned
   * @returns {String[]} An array of task names on which the named task depends which will be empty if it has no
   * dependencies.
   */
  dependencies(name) {
    let task = this[tasksSymbol].get(name)

    return task.dependencies.slice()
  }

  /**
   * Returns a list of names for tasks that have been registered.
   *
   * @returns {String[]} An array of registered task names which will be empty if none exist.
   */
  names() {
    return Array.from(this[tasksSymbol].keys())
  }

  /**
   * TODO: Document
   *
   * @param {Task} task -
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
   * @param {String|String[]} [names] -
   * @returns {Promise}
   */
  run(names) {
    names = Utils.asArray(names)

    // TODO: Complete
  }

  /**
   * TODO: Document
   *
   * @param {String} name -
   * @param {String|String[]} [dependencies=[]] -
   * @param {taskRunnable} runnable -
   * @returns {Moan}
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