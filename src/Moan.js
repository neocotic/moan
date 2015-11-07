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
const findup = require('findup-sync')
const fs = require('fs')

const FileSet = require('./FileSet')
const Logger = require('./Logger')
const Task = require('./Task')
const Utils = require('./Utils')

const cachedVersionSymbol = Symbol('cachedVersion')
const configsSymbol = Symbol('configs')
const fileSetsSymbol = Symbol('fileSets')
const getFileSetSymbol = Symbol('getFileSet')
const getTaskSymbol = Symbol('getTask')
const runTaskSymbol = Symbol('runTask')
const runTasksSymbol = Symbol('runTasks')
const taskStackSymbol = Symbol('taskStack')
const tasksSymbol = Symbol('tasks')

/**
 * A moaning task manager which can't help but register and run any task that your heart desires, although expect it to
 * moan about it.
 *
 * @access public
 */
class Moan extends EventEmitter {

  /**
   * Creates a new instance of {@link Moan} with no registered tasks.
   *
   * @param {MaonOptions} [options] - the options for the {@link Moan}
   * @access public
   */
  constructor(options) {
    super()

    options = Object.assign({}, Moan.defaults, options)

    /**
     * Whether the {@link Logger} should use colors.
     *
     * @access public
     * @type {boolean}
     */
    this.color = !!options.color

    /**
     * A map of shared configurations.
     *
     * @access private
     * @type {Map<string, *}
     */
    this[configsSymbol] = new Map()

    /**
     * Whether {@link Logger#debug} should output.
     *
     * @access public
     * @type {boolean}
     */
    this.debug = !!options.debug

    /**
     * A map of {@link FileSet} IDs and their registered instance.
     *
     * @access private
     * @type {Map<string, FileSet>}
     */
    this[fileSetsSymbol] = new Map()

    /**
     * Whether tasks should be forced to execute even after errors.
     *
     * @access public
     * @type {boolean}
     */
    this.force = !!options.force

    /**
     * The logger for this {@link Moan} instance.
     *
     * @access public
     * @type {Logger}
     */
    this.log = new Logger(this)

    /**
     * The current stack of tasks being executed.
     *
     * @access private
     * @type {string[]}
     */
    this[taskStackSymbol] = []

    /**
     * A map of {@link Task} names and their registered instance.
     *
     * @access private
     * @type {Map<string, Task>}
     */
    this[tasksSymbol] = new Map()
  }

  /**
   * Returns the shared configuration with the <code>key</code> provided.
   *
   * If a <code>value</code> is also provided, it will be assigned to the configuration with for <code>key</code>.
   *
   * This is especially useful when breaking tasks down into separate files as it allows any kind of configurations to
   * be shared between them.
   *
   * @example
   * moan.config('version', require('./package.json').version)
   *
   * moan.task('deploy', () => {
   *   return paas.deploy(version)
   * })
   * @param {string} key - the key of the configuration to be returned or have its <code>value</code> assigned
   * @param {*} [value] - the value to be assigned to the configuration with the <code>key</code> provided
   * @return {*} The value of the configuration with the given <code>key</code>.
   * @access public
   */
  config(key, value) {
    if (arguments.length === 1) {
      return this[configsSymbol].get(key)
    }

    this.log.debug(`Setting the configuration "${key}": ${value}`)

    this[configsSymbol].set(key, value)

    return value
  }

  /**
   * An array of shared configuration keys in the order in which they were configured and will be empty if none exist.
   *
   * @example
   * moan.config('username', process.env.USER || process.env.USERNAME)
   * moan.config('version', require('./package.json').version)
   *
   * moan.configs
   * //=> [ "username", "version" ]
   * @access public
   * @type {string[]}
   */
  get configs() {
    return Array.from(this[configsSymbol].keys())
  }

  /**
   * The name of the task currently being executed.
   *
   * @access public
   * @type {string}
   */
  get currentTask() {
    return this[taskStackSymbol][this[taskStackSymbol].length - 1]
  }

  /**
   * Returns the {@link FileSet} for the specified <code>id</code>.
   *
   * If either <code>patterns</code> or <code>options</code> are provided, a new {@link FileSet} will be created and
   * associated with the given <code>id</code>. Otherwise, this method will simply attempt to return a previously
   * associated {@link FileSet} and throw an error if it's unable to do set.
   *
   * This is useful for defining sets of files once and then simply referencing elsewhere within your tasks.
   *
   * It's important to note that, while you can extend the returned file set using {@link FileSet#expand}, the original
   * {@link FileSet} is unchanged and the new one will not be registered.
   *
   * @example <caption>Manage source files and compilation output directory using glob patterns</caption>
   * moan.fileSet('output', 'lib/')
   * moan.fileSet('sources', 'src/*.coffee')
   *
   * moan.task('clean', () => {
   *   return moan.fileSet('output')
   *     .del()
   * })
   *
   * moan.task('compile', 'clean', () => {
   *   return moan.fileSet('sources')
   *     .get()
   *     .then((sourceFiles) => {
   *       ...
   *     })
   * })
   * @example <caption>Pass glob options for more control</caption>
   * moan.fileSet('images', [ 'public/favicon.ico' 'public/img/*.{gif,jp?(e)g,png}' ], { nocase: true })
   * @param {string} id - the ID of either the existing {@link FileSet} to be returned (if only the <code>id</code> is
   * provided) or to be associated with the {@link FileSet} that is to be created based on the given
   * <code>patterns</code> and glob <code>options</code>
   * @param {string|string[]} [patterns=[]] - the glob pattern(s) to be used by the created {@link FileSet}
   * @param {Object} [options={}] - the glob options to be used by the created {@link FileSet}
   * @return {FileSet} The {@link FileSet} associated with the given <code>id</code>, which may just have been
   * registered/re-registered if either <code>patterns</code> or <code>options</code> were also specified.
   * @throws {Error} If only <code>id</code> is provied but no {@link FileSet} could be found for it.
   * @access public
   */
  fileSet(id, patterns, options) {
    if (arguments.length === 1) {
      return this[getFileSetSymbol](id)
    }

    let fileSet = new FileSet(patterns, options)

    this.log.debug(`Registering file set with ID "${id}" for patterns: ${fileSet.patterns}`)

    this[fileSetsSymbol].set(id, fileSet)

    return fileSet
  }

  /**
   * An array of registered file set IDs in the order in which they were registered and will be empty if none exist.
   *
   * @example
   * moan.fileSet('docs', 'docs/')
   * moan.fileSet('sources', [ 'public/js/*.js', 'lib/*.js' ])
   * moan.fileSet('tests', [ 'test/*-test.js', 'spec/*.spec.js' ])
   *
   * moan.fileSets
   * //=> [ "docs", "sources", "tests" ]
   * @access public
   * @type {string[]}
   */
  get fileSets() {
    return Array.from(this[fileSetsSymbol].keys())
  }

  /**
   * Returns the {@link FileSet} with the specified <code>id</code> or throws an error if none could be found.
   *
   * @param {string} id - the ID of the {@link FileSet} to be returned
   * @return {FileSet} The {@link FileSet} with the given <code>id</code>.
   * @throws {Error} If no {@link FileSet} can be found for the given <code>id</code>.
   * @access private
   */
  [getFileSetSymbol](id) {
    let fileSet = this[fileSetsSymbol].get(id)
    if (!fileSet) {
      throw new Error(`Could not find file set: ${id}`)
    }

    return fileSet
  }

  /**
   * Returns the {@link Task} with the specified <code>name</code> or throws an error if none could be found.
   *
   * @param {string} name - the name of the {@link Task} to be returned
   * @return {Task} The {@link Task} with the given <code>name</code>.
   * @throws {Error} If no {@link Task} can be found for the given <code>name</code>.
   * @access private
   */
  [getTaskSymbol](name) {
    let task = this[tasksSymbol].get(name)
    if (!task) {
      throw new Error(`Could not find task: ${name}`)
    }

    return task
  }

  /**
   * Returns whether any registered {@link Task} has failed to run successfully.
   *
   * This method will return <code>false</code> even if no tasks have been executed.
   *
   * @return {boolean} <code>true</code> if at least one {@link Task} failed to completed; otherwise
   * <code>false</code>.
   * @access private
   */
  hasFailures() {
    return Array.from(this[tasksSymbol].values()).some((task) => task.failed)
  }

  /**
   * Runs all of the tasks with the given <code>names</code>, returning a <code>Promise</code> which will be fullfilled
   * once all of the tasks and their dependencies have been executed or rejected if any of the them fail to execute.
   *
   * The returned <code>Promise</code> may also be rejected if a task could not be found for any of the given
   * <code>names</code> or there is a cyclic dependency.
   *
   * @example
   * moan.task('build', [ 'compile', 'test' ])
   * moan.task('compile', () => { ... })
   * moan.task('lint', () => { ... })
   * moan.task('test', 'lint', () => { ... })
   *
   * moan.run('build')
   *   .then(() => { ... })
   *   .catch((error) => { ... })
   *
   * moan.run([ 'compile', 'test' ])
   *   .then(() => { ... })
   *   .catch((error) => { ... })
   * @param {string|string[]} [names] - the name or names of the tasks to be executed
   * @return {Promise} The <code>Promise</code> to track progress of the all the task executions.
   * @access public
   */
  run(names) {
    names = Utils.asArray(names)
    if (names.length === 0) {
      names.push('default')
    }

    this.log.debug(`Running tasks: ${names}`)

    this[taskStackSymbol].splice(0, this[taskStackSymbol].length)

    return Promise.resolve()
      .then(() => this[runTasksSymbol](names))
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
   * @access private
   */
  [runTaskSymbol](task) {
    if (this[taskStackSymbol].indexOf(task.name) >= 0) {
      throw new Error(`Cyclic dependency found: ${task.name}`)
    }

    this[taskStackSymbol].push(task.name)

    let prerequisite = task.dependencies.length > 0 ? this[runTasksSymbol](task.dependencies) : Promise.resolve()

    return prerequisite
      .then(() => task.run())
      .then((result) => {
        this[taskStackSymbol].pop()

        return result
      })
      .catch((error) => {
        if (!this.force) {
          throw error
        }
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
   * The returned <code>Promise</code> may be rejected if a task could not be found for any of the given
   * <code>names</code> or there is a cyclic dependency.
   *
   * @param {string[]} names - the name of the tasks to be executed
   * @return {Promise} The <code>Promise</code> to track progress of the all the task executions.
   * @access private
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
   * Registers a task with the specified <code>name</code> and with any optional <code>dependencies</code> provided or
   * simply returns the {@link Task} registered against the given <code>name</code> if no other arguments are provided.
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
   * moan.task('notify-latest', [ 'update', 'deploy' ], (done) => {
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
   * @return {Task} The {@link Task} associated with the given <code>name</code>, which may just have been
   * registered/re-registered if either <code>dependencies</code> or <code>runnable</code> were also specified.
   * @throws {Error} If only <code>name</code> is provied but no {@link Task} could be found for it.
   * @access public
   */
  task(name, dependencies, runnable) {
    if (arguments.length === 1) {
      return this[getTaskSymbol](name)
    }

    let task = new Task(name, dependencies, runnable)

    this.log.debug(`Registering task for name "${name}"`)

    this[tasksSymbol].set(name, task)

    task
      .on('done', (value) => {
        this.emit('done', name, value)
      })
      .on('error', (error) => {
        this.emit('error', name, error)
      })
      .on('start', () => {
        this.emit('start', name)
      })

    return task
  }

  /**
   * An array of registered task names in the order in which they were registered and will be empty if none exist.
   *
   * @example
   * moan.task('build', [ 'compile', 'test' ])
   * moan.task('compile', () => { ... })
   * moan.task('lint', () => { ... })
   * moan.task('test', 'lint', () => { ... })
   *
   * moan.tasks
   * //=> [ "build", "compile", "lint", "test" ]
   * @access public
   * @type {string[]}
   */
  get tasks() {
    return Array.from(this[tasksSymbol].keys())
  }

  /**
   * The current version of this module.
   *
   * @access public
   * @type {string}
   */
  get version() {
    /* eslint "no-sync": 0 */
    if (this[cachedVersionSymbol]) {
      return this[cachedVersionSymbol]
    }

    let pkgFile = findup('package.json', { cwd: __dirname })
    let pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'))

    this[cachedVersionSymbol] = pkg.version

    return this[cachedVersionSymbol]
  }
}

/**
 * Options for the {@link Moan} constructor.
 *
 * @access public
 * @typedef {Object} MoanOptions
 * @property {boolean} [color=true] - <code>true</code> to enable colors when logging; otherwise <code>false</code>.
 * @property {boolean} [debug=false] - <code>true</code> to enable debug-level logging; otherwise <code>false</code>.
 * @property {boolean} [force=false] - <code>true</code> to keep running tasks after errors; otherwise
 * <code>false</code>.
 */
Moan.defaults = {
  color: true,
  debug: false,
  force: false
}

module.exports = Moan