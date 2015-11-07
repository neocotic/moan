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
const Command = require('commander').Command
const findup = require('findup-sync')
const fs = require('fs')
const moment = require('moment')
const numeral = require('numeral')
const path = require('path')
const resolveModule = require('resolve')

const globalMoan = require('..')
const Utils = require('./Utils')

const applyOptionsSymbol = Symbol('applyOptions')
const commandSymbol = Symbol('command')
const errorHandledSymbol = Symbol('errorHandled')
const finalizeSymbol = Symbol('finalize')
const handleErrorSymbol = Symbol('handleError')
const localSymbol = Symbol('local')
const loggedOptionsSymbol = Symbol('loggedOptions')
const moanSymbol = Symbol('moan')

/**
 * Manages interaction with this module from the command-line interface.
 *
 * @access public
 */
class CommandLineInterface {

  /**
   * Creates a new instance of {@link CommandLineInterface}.
   *
   * @param {CommandLineInterfaceOptions} [options] - the options for the {@link CommandLineInterface}
   * @access public
   */
  constructor(options) {
    options = Object.assign({}, CommandLineInterface.defaults, options)

    /**
     * The {@link Moan} instance being used by this {@link CommandLineInterface}.
     *
     * @access private
     * @type {Moan}
     */
    this[moanSymbol] = options.moan

    /**
     * The dedicated <code>Command</code> for this {@link CommandLineInterface}.
     *
     * @access private
     * @type {Command}
     */
    this[commandSymbol] = new Command()
      .usage('[options] <task ...>')
      .version(this[moanSymbol].version)
      .option('-d, --debug', 'enable debug output')
      .option('-f, --file [name]', 'specify alternative name for the Moaning file')
      .option('--force', 'force tasks to run even after errors')
      .option('-l, --list', 'list all available tasks')
      .option('--no-color', 'disable color output')
      .option('--stack', 'print stack traces for errors')
  }

  /**
   * Applies the parsed options from the <code>Command</code> to the current {@link Moan} instance.
   *
   * @access private
   */
  [applyOptionsSymbol]() {
    let color = !!this[commandSymbol].color
    let debug = !!this[commandSymbol].debug
    let force = !!this[commandSymbol].force

    this[moanSymbol].color = color
    this[moanSymbol].debug = debug
    this[moanSymbol].force = force

    if (!this[loggedOptionsSymbol]) {
      this[loggedOptionsSymbol] = true

      this[moanSymbol].log.debug(`color option: ${color}`)
      this[moanSymbol].log.debug(`debug option: ${debug}`)
      this[moanSymbol].log.debug(`force option: ${force}`)
    }
  }

  /**
   * Finishes up by logging some useful statistics about the overall execution.
   *
   * @param {Moment} start - the moment on which the CLI was executed
   * @param {Error} [error] - the error that occurred during the execution, where applicable
   * @access private
   */
  [finalizeSymbol](start, error) {
    let end = moment.utc()
    let memory = process.memoryUsage()

    let result = 'BUILD '
    if (error) {
      result += 'FAILED'
    } else {
      result += `SUCCESS${this[moanSymbol].hasFailures() ? ' (WITH ERRORS)' : ''}`
    }

    this[moanSymbol].log
      .write('\n')
      .separator()
      .write(chalk.bold(result))
      .write('\n')
      .separator()
      .write(`Total time: ${moment.utc(end.diff(start)).format('HH:mm:ss:SSS')}\n`)
      .write(`Finished at: ${end.format('ddd MMM DD HH:mm:SS z YYYY')}\n`)
      .write(`Final memory: ${numeral(memory.heapUsed).format('0b')}/${numeral(memory.heapTotal).format('0b')}\n`)
  }

  /**
   * Handles the specified <code>error</code> which has been encountered.
   *
   * This method will only handle <code>error</code> once to ensure that the high-level catch doesn't handle it again,
   * resulting it duplicate logs.
   *
   * @param {Error} error - the <code>Error</code> to be handled
   * @access private
   */
  [handleErrorSymbol](error) {
    if (!error[errorHandledSymbol]) {
      error[errorHandledSymbol] = true

      if (error.message) {
        this[moanSymbol].log.error(error.message)
      } else {
        this[moanSymbol].log.error(error)
      }

      if (error.stack && this[commandSymbol].stack) {
        let stack = error.stack
          .split('\n')
          .splice(1)
          .join('\n')

        this[moanSymbol].log.write(`${stack}\n`)
      }

      if (!this[commandSymbol].stack) {
        this[moanSymbol].log.writeln('Use the --stack option to print stack traces for errors to help debug problems')
      }
    }
  }

  /**
   * Logs the list of available task names.
   *
   * @access public
   */
  list() {
    if (this[moanSymbol].tasks.length) {
      this[moanSymbol].log.writeln('The following tasks are available:\n')

      this[moanSymbol].tasks.forEach((task) => this[moanSymbol].log.writeln(task))
    } else {
      this[moanSymbol].log.writeln('No tasks were found')
    }
  }

  /**
   * Attempts to load the Moaning file from the current working directory or one of its ancestors and, as a result, the
   * working directory will be changed to that which contains the Moaning file.
   *
   * This method returns a <code>Promise</code> which is resolved only when a Moaning file is found and loaded
   * successfully but may be rejected if the Moaning file could not be found or is invalid.
   *
   * @return {Promise} The <code>Promise</code> for tracking finding and loading the Moaning file.
   * @access public
   */
  load() {
    return new Promise((resolve, reject) => {
      let moaningFile = this[commandSymbol].file || findup('Moaning.js', { nocase: true })
      if (!moaningFile) {
        throw new Error(`Unable to find ${path.basename(moaningFile)} file`)
      }

      fs.stat(moaningFile, (error, stat) => {
        if (error) {
          reject(`Unable to find file: ${moaningFile}`)
        } else if (!stat.isFile()) {
          reject(`Not a valid file: ${moaningFile}`)
        } else {
          process.chdir(path.dirname(moaningFile))
          require(path.resolve(moaningFile))

          resolve(moaningFile)
        }
      })
    })
  }

  /**
   * Loads the local Moan module relative to the current working directory.
   *
   * This method will fall back on global Moan module (this one) if none could be found locally.
   *
   * @return {Promise} The <code>Promise</code> for tracking the module loading.
   * @access private
   */
  [localSymbol]() {
    return new Promise((resolve) => {
      resolveModule('moan', { basedir: process.cwd() }, (error, moan) => {
        if (error) {
          this[moanSymbol].log.warn('Could not find local "moan" module so falling back to global module')

          moan = this[moanSymbol]
        }

        resolve(moan)
      })
    })
  }

  /**
   * Parses the specified command-line arguments and invokes the necessary action(s) as a result.
   *
   * @param {string|string[]} [args=[]] - the command-line arguments to be parsed
   * @return {Promise} The <code>Promise</code> for tracking the execution of command-line actions.
   * @access public
   */
  parse(args) {
    args = Utils.asArray(args)

    let build = false
    let start = moment.utc()

    this[commandSymbol].parse(args)

    this[applyOptionsSymbol]()

    this[localSymbol]()
      .then((moan) => {
        this[moanSymbol] = moan

        this[applyOptionsSymbol]()

        moan
          .on('start', () => {
            moan.log.writeln('Running...')
          })
          .on('done', () => {
            moan.log.ok()
          })
          .on('error', (name, error) => {
            this[handleErrorSymbol](error)
          })

        return this.load()
      })
      .then(() => {
        if (this[commandSymbol].list) {
          this.list()
        } else {
          build = true

          return this[moanSymbol].run(this[commandSymbol].args)
        }
      })
      .then(() => {
        if (build) {
          this[finalizeSymbol](start)
        }
      })
      .catch((error) => {
        this[handleErrorSymbol](error)

        if (this[moanSymbol].currentTask) {
          if (!this[commandSymbol].force) {
            this[moanSymbol].log.writeln('Use the --force option to continue running tasks even after an error')
          }

          this[moanSymbol].log.writeln(chalk.bgRed.bold('Aborted!'))
        }

        if (build) {
          this[finalizeSymbol](start, error)
        }
      })
  }
}

/**
 * Options for the {@link CommandLineInterface} constructor.
 *
 * @access public
 * @typedef {Object} CommandLineInterfaceOptions
 * @property {Moan} [moan] - the {@link Moan} instance to be used
 */
CommandLineInterface.defaults = {
  moan: globalMoan
}

module.exports = CommandLineInterface