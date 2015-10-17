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
const path = require('path')

const moan = require('./moan')
const Utils = require('./utils')

const commandSymbol = Symbol('command')
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
      .option('-l, --list', 'list all available tasks')
      .option('--no-color', 'disable color output')
      .option('--stack', 'print stack traces for errors')
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
    if (!moanFile) return Promise.reject(`Unable to find ${fileName} file`)

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

    moan.color = !command.noColor
    moan.debug = command.debug

    this[loadSymbol]()
      .then(() => {
        if (command.list) {
          this[listSymbol]()
        } else {
          return moan.run(command.args)
        }
      })
      .catch((error) => {
        if (error.message) {
          moan.log.error(error.message)
        } else {
          moan.log.error(error)
        }

        if (error.stack && command.stack) {
          let stack = error.stack
            .split('\n')
            .splice(1)
            .join('\n')

          moan.log.writeln(stack, false)
        }

        if (moan.currentTask) {
          moan.log
            .write('\n')
            .writeln(chalk.bgRed.bold('Aborted!'))
        }
      })
  }
}

module.exports = new CommandLineInterface()
exports.CommandLineInterface = CommandLineInterface