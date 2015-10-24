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
const expect = require('expect.js')
const fs = require('fs')
const sinon = require('sinon')

const Logger = require('../lib/logger')
const singleton = require('../lib/moan')
const Moan = singleton.Moan

describe('moan', () => {
  it('should be a singleton instance of Moan', () => {
    expect(singleton).to.be.ok()
    expect(singleton).to.be.a(Moan)
  })
})

describe('Moan', () => {
  let moan

  beforeEach(() => {
    moan = new Moan()
    moan.log = sinon.stub(moan.log)
  })

  it('should extend from EventEmitter', () => {
    expect(moan).to.be.an(EventEmitter)
  })

  describe('#constructor', () => {
    it('should setup class correctly', () => {
      let options = { color: false, debug: true }

      moan = new Moan(options)

      expect(moan.color).to.be(false)
      expect(moan.configs).to.eql([])
      expect(moan.currentTask).not.to.be.ok()
      expect(moan.debug).to.be(true)
      expect(moan.fileSets).to.eql([])
      expect(moan.log).to.be.a(Logger)
      expect(moan.tasks).to.eql([])
    })

    context('when no options are provided', () => {
      it('should use default values', () => {
        moan = new Moan()

        expect(moan.color).to.be(true)
        expect(moan.configs).to.eql([])
        expect(moan.currentTask).not.to.be.ok()
        expect(moan.debug).to.be(false)
        expect(moan.fileSets).to.eql([])
        expect(moan.log).to.be.a(Logger)
        expect(moan.tasks).to.eql([])
      })
    })
  })

  describe('#config', () => {
    context('when only configuration key is provided', () => {
      it('should return configuration value', () => {
        moan.config('foo', 'bar')

        expect(moan.config('foo')).to.be('bar')
      })

      it('should return nothing if key does not exist', () => {
        expect(moan.config('foo')).not.to.be.ok()
      })
    })

    context('when configuration key and value are provided', () => {
      it('should return newly configured value', () => {
        expect(moan.config('foo', 'bar')).to.be('bar')
      })

      it('should replace any previously configured value', () => {
        expect(moan.config('foo', 'bar')).to.be('bar')
        expect(moan.config('foo', 'baz')).to.be('baz')

        expect(moan.config('foo')).to.be('baz')
      })
    })
  })

  describe('#configs', () => {
    it('should be contain all unique configurations', () => {
      moan.config('foo', 'bar')
      moan.config('fu', 'baz')
      moan.config('foo', 'buzz')

      expect(moan.configs).to.eql([ 'foo', 'fu' ])
    })

    context('when nothing has been configured', () => {
      it('should be an empty array', () => {
        expect(moan.configs).to.eql([])
      })
    })

    it('should be read-only', () => {
      try {
        moan.configs = [ 'foo' ]

        expect().fail('Should have thrown error')
      } catch (error) {
        expect(error).to.be.a(TypeError)
      }
    })

    it('should not allow modifications', () => {
      moan.configs.push('foo')

      expect(moan.configs).to.eql([])
    })
  })

  describe('#currentTask', () => {
    context('when idle', () => {
      it('should be nothing', () => {
        expect(moan.currentTask).not.to.be.ok()
      })
    })

    context('when tasks have finished successfully', () => {
      it('should be nothing', (done) => {
        moan.task('good', () => Promise.resolve('Yipee!'))
        moan.task('default', 'good')

        moan.run()
          .then(() => {
            expect(moan.currentTask).not.to.be.ok()
          })
          .then(done, done)
      })
    })

    context('when tasks have finished erroneously', () => {
      it('should be task that failed for debugging purposes', (done) => {
        moan.task('bad', () => Promise.reject('Oops!'))
        moan.task('default', 'bad')

        moan.run()
          .then(() => {
            expect().fail('Should have been rejected')
          })
          .catch(() => {
            expect(moan.currentTask).to.be('bad')
          })
          .then(done, done)
      })
    })

    context('when tasks still in progress', () => {
      it('should be current task', (done) => {
        moan.task('default', (callback) => {
          setImmediate(callback)
        })

        moan.on('started', () => {
          expect(moan.currentTask).to.be('default')

          done()
        })

        moan.run()
      })
    })
  })

  describe('#dependencies', () => {
    it('should return the dependencies for the tasks', () => {
      let expected = [ 'foo', 'bar' ]

      moan.task('default', expected)

      expect(moan.dependencies('default')).to.eql(expected)
    })

    context('when task has no dependencies', () => {
      it('should return an empty array', () => {
        moan.task('default')

        expect(moan.dependencies('default')).to.eql([])
      })
    })

    context('when task does not exist', () => {
      it('should throw an error', () => {
        expect(moan.dependencies.bind(moan)).withArgs('default').to.throwError()
      })
    })

    it('should not allow modifications', () => {
      let expected = [ 'foo', 'bar' ]

      moan.task('default', expected)
      moan.dependencies('default').push('fu')

      expect(moan.dependencies('default')).to.eql(expected)
    })
  })

  describe('#failed', () => {
    context('when task has failed to complete', () => {
      it('should return true', (done) => {
        moan.task('default', () => Promise.reject('Oops!'))

        moan.run()
          .then(() => {
            expect().fail('Should have been rejected')
          })
          .catch(() => {
            expect(moan.failed('default')).to.be(true)
          })
          .then(done, done)
      })
    })

    context('when task has completed successfully', () => {
      it('should return false', (done) => {
        moan.task('default', () => Promise.resolve('Yipee!'))

        moan.run()
          .then(() => {
            expect(moan.failed('default')).to.be(false)
          })
          .then(done, done)
      })
    })

    context('when task is not complete', () => {
      it('should return false', () => {
        moan.task('default')

        expect(moan.failed('default')).to.be(false)
      })
    })

    context('when task does not exist', () => {
      it('should throw an error', () => {
        expect(moan.failed.bind(moan)).withArgs('default').to.throwError()
      })
    })
  })

  describe('#fileSet', () => {
    // TODO: Complete unit tests
  })

  describe('#fileSets', () => {
    it('should be contain all unique registered file sets', () => {
      moan.fileSet('foo', [])
      moan.fileSet('bar', [])
      moan.fileSet('foo', [])

      expect(moan.fileSets).to.eql([ 'foo', 'bar' ])
    })

    context('when no file sets have been registered', () => {
      it('should be an empty array', () => {
        expect(moan.fileSets).to.eql([])
      })
    })

    it('should be read-only', () => {
      try {
        moan.fileSets = [ 'foo' ]

        expect().fail('Should have thrown error')
      } catch (error) {
        expect(error).to.be.a(TypeError)
      }
    })

    it('should not allow modifications', () => {
      moan.fileSets.push('foo')

      expect(moan.fileSets).to.eql([])
    })
  })

  describe('#finished', () => {
    context('when task has finished erroneously', () => {
      it('should return true', (done) => {
        moan.task('default', () => Promise.reject('Oops!'))

        moan.run()
          .then(() => {
            expect().fail('Should have been rejected')
          })
          .catch(() => {
            expect(moan.finished('default')).to.be(true)
          })
          .then(done, done)
      })
    })

    context('when task has finished successfully', () => {
      it('should return true', (done) => {
        moan.task('default', () => Promise.resolve('Yipee!'))

        moan.run()
          .then(() => {
            expect(moan.finished('default')).to.be(true)
          })
          .then(done, done)
      })
    })

    context('when task is not complete', () => {
      it('should return false', () => {
        moan.task('default')

        expect(moan.finished('default')).to.be(false)
      })
    })

    context('when task does not exist', () => {
      it('should throw an error', () => {
        expect(moan.finished.bind(moan)).withArgs('default').to.throwError()
      })
    })
  })

  describe('#result', () => {
    context('when synchronous task is finished', () => {
      it('should return result if one is returned', (done) => {
        let expected = 'foo'

        moan.task('default', () => expected)

        moan.run()
          .then(() => {
            expect(moan.result('default')).to.be(expected)
          })
          .then(done, done)
      })

      it('should return nothing if nothing is returned', (done) => {
        moan.task('default', () => {})

        moan.run()
          .then(() => {
            expect(moan.result('default')).not.to.be.ok()
          })
          .then(done, done)
      })
    })

    context('when asynchronous task with a callback function is finished', () => {
      it('should return result if one is passed', (done) => {
        let expected = 'foo'

        moan.task('default', (callback) => {
          callback(null, expected)
        })

        moan.run()
          .then(() => {
            expect(moan.result('default')).to.be(expected)
          })
          .then(done, done)
      })

      it('should return nothing if nothing is passed', (done) => {
        moan.task('default', (callback) => {
          callback(null)
        })

        moan.run()
          .then(() => {
            expect(moan.result('default')).not.to.be.ok()
          })
          .then(done, done)
      })
    })

    context('when asynchronous task with a promise is finished', () => {
      it('should return result if resolved with one', (done) => {
        let expected = 'foo'

        moan.task('default', () => Promise.resolve(expected))

        moan.run()
          .then(() => {
            expect(moan.result('default')).to.be(expected)
          })
          .then(done, done)
      })

      it('should return nothing if nothing is returned', (done) => {
        moan.task('default', () => Promise.resolve())

        moan.run()
          .then(() => {
            expect(moan.result('default')).not.to.be.ok()
          })
          .then(done, done)
      })
    })

    it('should return nothing if task has finished erroneously', (done) => {
      moan.task('default', () => Promise.reject('Oops!'))

      moan.run()
        .then(() => {
          expect().fail('Should have been rejected')
        })
        .catch(() => {
          expect(moan.result('default')).not.to.be.ok()
        })
        .then(done, done)
    })

    it('should throw an error if task does not exist', () => {
      expect(moan.result.bind(moan)).withArgs('default').to.throwError()
    })

    it('should throw an error if task has not finished', () => {
      moan.task('default', () => Promise.resolve('Yipee!'))

      expect(moan.result.bind(moan)).withArgs('default').to.throwError()
    })
  })

  describe('#run', () => {
    // TODO: Complete unit tests
  })

  describe('#started', () => {
    context('when task has finished erroneously', () => {
      it('should return true', (done) => {
        moan.task('default', () => Promise.reject('Oops!'))

        moan.run()
          .then(() => {
            expect().fail('Should have been rejected')
          })
          .catch(() => {
            expect(moan.started('default')).to.be(true)
          })
          .then(done, done)
      })
    })

    context('when task has finished successfully', () => {
      it('should return true', (done) => {
        moan.task('default', () => Promise.resolve('Yipee!'))

        moan.run()
          .then(() => {
            expect(moan.started('default')).to.be(true)
          })
          .then(done, done)
      })
    })

    context('when task has started but not completed (in progress)', () => {
      it('should return true', (done) => {
        moan.task('default', (callback) => {
          setImmediate(callback)
        })

        moan.on('started', () => {
          expect(moan.started('default')).to.be(true)
          expect(moan.finished('default')).to.be(false)

          done()
        })

        moan.run()
      })
    })

    context('when task has not started', () => {
      it('should return false', () => {
        moan.task('default')

        expect(moan.started('default')).to.be(false)
      })
    })

    context('when task does not exist', () => {
      it('should throw an error', () => {
        expect(moan.started.bind(moan)).withArgs('default').to.throwError()
      })
    })
  })

  describe('#task', () => {
    // TODO: Complete unit tests
  })

  describe('#tasks', () => {
    it('should be contain all unique registered tasks', () => {
      moan.task('foo')
      moan.task('bar')
      moan.task('foo')

      expect(moan.tasks).to.eql([ 'foo', 'bar' ])
    })

    context('when no tasks have been registered', () => {
      it('should be an empty array', () => {
        expect(moan.tasks).to.eql([])
      })
    })

    it('should be read-only', () => {
      try {
        moan.tasks = [ 'foo' ]

        expect().fail('Should have thrown error')
      } catch (error) {
        expect(error).to.be.a(TypeError)
      }
    })

    it('should not allow modifications', () => {
      moan.tasks.push('foo')

      expect(moan.tasks).to.eql([])
    })
  })

  describe('#version', () => {
    let spyReadFileSync

    beforeEach(() => {
      spyReadFileSync = sinon.spy(fs, 'readFileSync')
    })

    afterEach(() => {
      spyReadFileSync.restore()
    })

    it('should match the version in the package descriptor', (done) => {
      fs.readFile('package.json', 'utf8', (error, data) => {
        if (error) {
          done(error)
        } else {
          expect(moan.version).to.be(JSON.parse(data).version)

          expect(spyReadFileSync.calledOnce).to.be.ok()

          done()
        }
      })
    })

    it('should cache version read from package descriptor', () => {
      let v1 = moan.version
      let v2 = moan.version

      expect(v1).to.be(v2)
      expect(spyReadFileSync.calledOnce).to.be.ok()
    })

    it('should be read-only', () => {
      try {
        moan.version = 'foo'

        expect().fail('Should have thrown error')
      } catch (error) {
        expect(error).to.be.a(TypeError)
      }
    })
  })
})