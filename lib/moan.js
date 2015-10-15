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
 * A moaning task manager which can't help but register and run any task that your heart desires, although expect it to
 * moan about it.
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
   * Returns whether the task with the specified <code>name</code> failed.
   *
   * This method will return <code>false</code> if the task has not even been ran so it's recommended that it is used
   * in conjunction with {@link Moan#finished}.
   *
   * @example
   * moan.task('compile', () => {
   *   throw new Error('Oh snap!')
   * })
   *
   * function taskHandler() {
   *   logger.log(`compile task failed: ${moan.failed('compile')}`)
   *   //=> true
   * }
   *
   * moan.run('compile')
   *   .then(taskHandler, taskHandler)
   * @param {string} name - the name of the task to be checked
   * @return {boolean} <code>true</code> if the named task has ran but failed to complete; otherwise
   * <code>false</code>.
   * @throws {Error} If no task could be found for the given <code>name</code>.
   * @public
   */
  failed(name) {
    let task = this[getTaskSymbol](name)

    return task.failed
  }

  /**
   * Returns whether the task with the specified <code>name</code> finished.
   *
   * This method only indicates whether the task has finished, regardless of whether it was successful. In order to
   * check if it passed successfully combine with {@link Moan#failed}.
   *
   * @example
   * moan.task('compile', () => { ... })
   *
   * function taskHandler() {
   *   logger.log(`compile task finished: ${moan.finished('compile')}`)
   *   //=> true
   * }
   *
   * moan.run('compile')
   *   .then(taskHandler, taskHandler)
   * @param {string} name - the name of the task to be checked
   * @return {boolean} <code>true</code> if the named task has finished running; otherwise <code>false</code>.
   * @throws {Error} If no task could be found for the given <code>name</code>.
   * @public
   */
  finished(name) {
    let task = this[getTaskSymbol](name)

    return task.finished
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
   * Returns a list of names for tasks that have been registered in the order in which they were registered.
   *
   * @example
   * moan.task('build', ['compile', 'test'], () => { ... })
   * moan.task('compile', () => { ... })
   * moan.task('lint', () => { ... })
   * moan.task('test', 'lint', () => { ... })
   *
   * moan.names()
   * //=> ["build", "compile", "lint", "test"]
   * @return {string[]} An array of registered task names which will be empty if none exist.
   * @public
   */
  names() {
    return Array.from(this[tasksSymbol].keys())
  }

  /**
   * Registers the specified <code>task</code> with this {@link Moan} instance so that it can be executed later.
   *
   * As a result, this {@link Moan} will also emit a <code>task</code> or <code>error</code> event if/when
   * <code>task</code> emits a <code>completed</code> or <code>failed</code> event respectively.
   *
   * @param {Task} task - the {@link Task} to be registered
   * @private
   */
  [registerTaskSymbol](task) {
    this[tasksSymbol].set(task.name, task)

    task
      .on('completed', (value) => {
        this.emit('task', value, task.name)
      })
      .on('failed', (error) => {
        this.emit('error', error, task.name)
      })
  }

  /**
   * Runs all of the tasks with the given <code>names</code>, returning a <code>Promise</code> which will be fullfilled
   * once all of the tasks and their dependencies have been executed or rejected if any of the them fail to execute.
   *
   * @example
   * moan.task('build', ['compile', 'test'], () => { ... })
   * moan.task('compile', () => { ... })
   * moan.task('lint', () => { ... })
   * moan.task('test', 'lint', () => { ... })
   *
   * moan.run('build')
   *   .then(() => { ... })
   *   .catch((error) => { ... })
   *
   * moan.run(['compile', 'test'])
   *   .then(() => { ... })
   *   .catch((error) => { ... })
   * @param {string|string[]} [names] - the name or names of the tasks to be executed
   * @return {Promise} The <code>Promise</code> to track progress of the all the task executions.
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
   * Executes the specified <code>task</code> as well as all of its dependencies, where applicable.
   *
   * This method will throw an error if <code>task</code> is already in the current stack. That is; either there is a
   * cyclic dependency (this <code>task</code> depends on another which in turn depends on the <code>task</code>) or
   * someone is attempting to run <code>task</code> within the its own {@link taskRunnable}.
   *
   * @param {Task} task - the {@link Task} to be executed, but only after all of its dependencies
   * @return {Promise} The <code>Promise</code> to track the task execution progress.
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
   * Executes each {@link Task} in the list of <code>names</code> provided.
   *
   * This method will throw an error if a {@link Task} could not be found in the list of <code>names</code> or one of
   * the tasks is already in the current stack. That is; either there is a cyclic dependency (a {@link Task} depends on
   * another which in turn depends on the {@link Task}) or someone is attempting to run a {@link Task} within the its
   * own {@link taskRunnable}.
   *
   * @param {string[]} names - the name of the tasks to be executed
   * @return {Promise} The <code>Promise</code> to track progress of the all the task executions.
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
   * Registers a task with the specified <code>name</code> and with any optional <code>dependencies</code> provided.
   *
   * The <code>runnable</code> function will be invoked if/when this task is executed either directly or indirectly (as
   * a dependency itself) via {@link Moan#run}. A no-operation function will be used if <code>runnable</code> is not
   * provided (or not a function).
   *
   * If <code>runnable</code> declares any arguments, the first argument (i.e. <code>done</code>) will be treated as a
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
   *
   * @example <caption>Register a synchronous task</caption>
   * moan.task('compile', () => {
   *   let sourceFiles = glob.sync('src/*.coffee')
   *   let targetFiles = sourceFiles.map((sourceFile) => {
   *     let source = fs.readFileSync(sourceFile, { encoding: 'utf8' })
   *     let target = CoffeeScript.compile(source)
   *
   *     let targetFile = path.join('lib', path.basename(sourceFile))
   *
   *     fs.writeFileSync(targetFile, CoffeeScript.compile(source))
   *
   *     return targetFile
   *   })
   *
   *   return targetFiles
   * })
   * @example <caption>Register a asynchronous task with a single dependency</caption>
   * moan.task('notify', 'deploy', () => {
   *   let options = {
   *     url: 'https://notify.example.com',
   *     formData: getDeployData()
   *   }
   *
   *   return new Promise((resolve, reject) => {
   *     request.post(options, (error, response, body) => {
   *       if (error) {
   *         reject(error)
   *       } else {
   *         resolve(body)
   *       }
   *     })
   *   })
   * })
   * @example <caption>Register a asynchronous task using a callback with multiple dependencies</caption>
   * moan.task('notify-latest', ['update', 'deploy'], (done) => {
   *   let options = {
   *     url: 'https://notify.example.com',
   *     formData: getDeployData()
   *   }
   *
   *   request.post(options, (error, response, body) => {
   *     if (error) {
   *       done(error)
   *     } else {
   *       done(null, body)
   *     }
   *   })
   * })
   * @example <caption>Register a task whose runnable function is loaded from another module</caption>
   * moan.task('test', 'lint', require('./tasks/test'))
   * @param {string} name - the name of the task to be used
   * @param {string|string[]} [dependencies=[]] - a list of task names that the task depends on
   * @param {taskRunnable} [runnable] - the runnable function that performs the task operation
   * @return {Moan} A reference to this {@link Moan} instance for chaining purposes.
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