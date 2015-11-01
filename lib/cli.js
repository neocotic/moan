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

const moan = require('./moan')
const Utils = require('./utils')

const commandSymbol = Symbol('command')
const finalize = Symbol('finalize')
const listSymbol = Symbol('list')
const loadSymbol = Symbol('load')

/**
 * Manages interaction with this module from the command-line interface.
 *
 * @public
 */
class CommandLineInterface {

  /**
   * Creates a new instance of {@link CommandLineInterface}.
   *
   * @public
   */
  constructor() {
    /**
     * The dedicated <code>Command</code> for this {@link CommandLineInterface}.
     *
     * @private
     * @type {Command}
     */
    this[commandSymbol] = new Command()
      .version(moan.version)
      .usage('[options] <task ...>')
      .option('-d, --debug', 'enable debug output')
      .option('-f, --file [name]', 'specify alternative name for the Moan file')
      .option('--force', 'force tasks to run even after errors')
      .option('-l, --list', 'list all available tasks')
      .option('--no-color', 'disable color output')
      .option('--stack', 'print stack traces for errors')

    moan
      .on('start', () => {
        moan.log.writeln('Running...')
      })
      .on('done', () => {
        moan.log.ok()
      })
      .on('error', (name, error) => {
        if (error.message) {
          moan.log.error(error.message)
        } else {
          moan.log.error(error)
        }

        if (error.stack && this[commandSymbol].stack) {
          let stack = error.stack
            .split('\n')
            .splice(1)
            .join('\n')

          moan.log.write(`${stack}\n`)
        }

        if (!this[commandSymbol].stack) {
          moan.log.writeln('Use the --stack option to print stack traces for errors to help debug problems')
        }
      })
  }

  /**
   * Finishes up by logging some useful statistics about the overall execution.
   *
   * @param {Moment} start - the moment on which the CLI was executed
   * @param {Error} [error] - the error that occurred during the execution, where applicable
   * @private
   */
  [finalize](start, error) {
    let end = moment.utc()
    let memory = process.memoryUsage()

    if (error) {
      if (!this[commandSymbol].force) {
        moan.log.writeln('Use the --force option to continue running tasks even after an error')
      }

      if (moan.currentTask) {
        moan.log.writeln(chalk.bgRed.bold('Aborted!'))
      }
    }

    moan.log
      .write('\n')
      .separator()
      .write(chalk.bold(`BUILD ${error ? 'FAILED' : 'SUCCESS'}`))
      .write('\n')
      .separator()
      .write(`Total time: ${moment.utc(end.diff(start)).format('HH:mm:ss:SSS')}\n`)
      .write(`Finished at: ${end.format('ddd MMM DD HH:mm:SS z YYYY')}\n`)
      .write(`Final memory: ${numeral(memory.heapUsed).format('0b')}/${numeral(memory.heapTotal).format('0b')}\n`)
  }

  /**
   * Logs the list of available task names.
   *
   * @private
   */
  [listSymbol]() {
    let tasks = moan.names()

    if (tasks.length) {
      moan.log.writeln('The following tasks are available:\n')

      tasks.forEach((task) => moan.log.writeln(task))
    } else {
      moan.log.writeln('No tasks were found')
    }
  }

  /**
   * Attempts to load the Moan file from the current working directory or one of its ancestors and, as a result, the
   * working directory will be changed to that which contains the Moan file.
   *
   * This method returns a <code>Promise</code> which is resolved only when a Moan file is found and loaded
   * successfully but may be rejected if the Moan file could not be found or is invalid.
   *
   * @return {Promise} The <code>Promise</code> for tracking finding and loading the Moan file.
   * @private
   */
  [loadSymbol]() {
    const fileName = 'Moan.js'
    let moanFile = this[commandSymbol].file || findup(fileName, { nocase: true })
    if (!moanFile) {
      return Promise.reject(`Unable to find ${fileName} file`)
    }

    return new Promise((resolve, reject) => {
      fs.stat(moanFile, (error, stat) => {
        if (error) {
          reject(`Unable to find file: ${moanFile}`)
        } else if (!stat.isFile()) {
          reject(`Not a valid file: ${moanFile}`)
        } else {
          process.chdir(path.dirname(moanFile))
          require(path.resolve(moanFile))

          resolve()
        }
      })
    })
  }

  /**
   * Parses the specified command-line arguments and invokes the necessary action(s) as a result.
   *
   * @param {string|string[]} [args=[]] - the command-line arguments to be parsed
   * @return {Promise} The <code>Promise</code> for tracking the execution of command-line actions.
   * @public
   */
  parse(args) {
    args = Utils.asArray(args)

    let command = this[commandSymbol].parse(args)
    let start = moment.utc()

    moan.color = !command.noColor
    moan.debug = command.debug
    moan.force = command.force

    this[loadSymbol]()
      .then(() => {
        if (command.list) {
          this[listSymbol]()
        } else {
          return moan.run(command.args)
        }
      })
      .then(() => {
        this[finalize](start)
      })
      .catch((error) => {
        this[finalize](start, error)
      })
  }
}

module.exports = new CommandLineInterface()
exports.CommandLineInterface = CommandLineInterface