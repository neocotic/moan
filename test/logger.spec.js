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
const expect = require('expect.js')
const sinon = require('sinon')
const Writable = require('stream').Writable

const Logger = require('../lib/logger')
const Moan = require('../lib/moan').Moan

describe('Logger', () => {
  let moan
  let options

  let logger

  /**
   * TODO: Document
   *
   * @param {string} methodName -
   * @param {Object} expectations -
   * @param {boolean} expectations.appendNewLine -
   * @param {string} expectations.prefix -
   * @param {boolean} expectations.prefixTask -
   * @param {boolean} expectations.requiresDebug -
   * @param {string} expectations.stream -
   * @private
   */
  function describeWriteMethod(methodName, streamOption, expectedPrefix, expectTaskName, expectNewLine, requiresDebug) {
    describe(`#${methodName}`, () => {
      let stubWrite
      let prefix = expectedPrefix ? `${expectedPrefix} ` : ''
      let suffix = expectNewLine ? '\n' : ''
      let message = `foo ${chalk.cyan('bar')}`
      let expectedMessage = `${prefix}${message}${suffix}`

      beforeEach(() => {
        stubWrite = options[streamOption].write
      })

      it(`should write message to "${streamOption}" stream`, () => {
        expect(logger[methodName](message)).to.be(logger)

        expect(stubWrite.callCount).to.be(1)
        expect(stubWrite.args).to.eql([ [ expectedMessage ] ])
      })

      context('when no message is provided', () => {
        it(`should write ${expectNewLine ? 'blank line' : 'empty string'}`, () => {
          expect(logger[methodName]()).to.be(logger)

          expect(stubWrite.callCount).to.be(1)
          expect(stubWrite.args).to.eql([ [ `${prefix.trim()}${suffix}` ] ])
        })
      })

      context('when color mode is disabled', () => {
        it('should write message without color', () => {
          moan.color = false

          expect(logger[methodName](message)).to.be(logger)

          expect(stubWrite.callCount).to.be(1)
          expect(stubWrite.args).to.eql([ [ chalk.stripColor(expectedMessage) ] ])
        })
      })

      context('when a task is running', () => {
        if (expectTaskName) {
          it('should write message with task name prefix', (done) => {
            moan.task('default', () => {
              expect(logger[methodName](message)).to.be(logger)

              expect(stubWrite.callCount).to.be(1)
              expect(stubWrite.args).to.eql([ [ `${chalk.bgWhite.black('[default]')} ${expectedMessage}` ] ])
            })

            moan.run()
              .then(() => done())
              .catch(done)
          })
        } else {
          it('should write message without task name prefix', (done) => {
            moan.task('default', () => {
              expect(logger[methodName](message)).to.be(logger)

              expect(stubWrite.callCount).to.be(1)
              expect(stubWrite.args).to.eql([ [ expectedMessage ] ])
            })

            moan.run()
              .then(() => done())
              .catch(done)
          })
        }
      })

      context('when debug mode is disabled', () => {
        beforeEach(() => {
          moan.debug = false
        })

        if (requiresDebug) {
          it('should write nothing', () => {
            expect(logger[methodName](message)).to.be(logger)

            expect(stubWrite.callCount).to.be(0)
          })
        } else {
          it(`should write message to "${streamOption}" stream`, () => {
            expect(logger[methodName](message)).to.be(logger)

            expect(stubWrite.callCount).to.be(1)
            expect(stubWrite.args).to.eql([ [ expectedMessage ] ])
          })
        }
      })
    })
  }

  beforeEach(() => {
    let err = new Writable()
    let out = new Writable()

    sinon.stub(err, 'write')
    sinon.stub(out, 'write')

    let dummyWritable = {
      write: () => {}
    }

    moan = new Moan({ debug: true })
    moan.log = new Logger(moan, {
      err: dummyWritable,
      out: dummyWritable
    })
    options = { err, out }

    logger = new Logger(moan, options)
  })

  describeWriteMethod('debug', 'out', chalk.blue('DEBUG'), true, true, true)
  describeWriteMethod('error', 'err', chalk.red('ERROR'), true, true)
  describeWriteMethod('ok', 'out', chalk.green('OK'), true, true)
  describeWriteMethod('warn', 'out', chalk.yellow('WARNING'), true, true)
  describeWriteMethod('write', 'out', null, false, false)
  describeWriteMethod('writeln', 'out', null, true, true)
})