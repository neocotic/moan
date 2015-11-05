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

const FileSet = require('../src/FileSet')
const Logger = require('../src/Logger')
const Moan = require('../src/Moan')
const Task = require('../src/Task')

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

      it('should return nothing if configuration does not exist', () => {
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

        moan.on('start', () => {
          expect(moan.currentTask).to.be('default')

          done()
        })

        moan.run()
      })
    })
  })

  describe('#fileSet', () => {
    context('when only file set ID is provided', () => {
      it('should return registered file set', () => {
        let fileSet = moan.fileSet('foo', '**/*.md')

        expect(moan.fileSet('foo')).to.be(fileSet)
      })

      it('should throw an error if file set does not exist', () => {
        expect(moan.fileSet.bind(moan)).withArgs('foo').to.throwError()
      })
    })

    context('when file set ID is provided with glob patterns and options', () => {
      it('should return newly created file set', () => {
        let patterns = [ '**/*.md', '**/*.txt' ]
        let options = { nodir: true, nocase: true }

        let fileSet = moan.fileSet('foo', patterns, options)

        expect(fileSet).to.be.a(FileSet)
        expect(fileSet.patterns).to.eql(patterns)

        expect(moan.fileSet('foo')).to.be(fileSet)
      })

      it('should replace any previously registered file set', () => {
        let fileSet = moan.fileSet('foo', '**/*.md')

        expect(fileSet).to.be.a(FileSet)
        expect(fileSet.patterns).to.eql([ '**/*.md' ])

        expect(moan.fileSet('foo')).to.be(fileSet)

        let replacement = moan.fileSet('foo', '**/*.txt')

        expect(replacement).to.be.a(FileSet)
        expect(replacement.patterns).to.eql([ '**/*.txt' ])

        expect(moan.fileSet('foo')).to.be(replacement)
      })
    })
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

  describe('#hasFailures', () => {
    it('should return false if all tasks complete successfully', (done) => {
      moan.task('foo', [])
      moan.task('default', 'foo')

      moan.run()
        .then(() => {
          expect(moan.hasFailures()).to.be(false)
        })
        .then(done, done)
    })

    it('should return true if a task fails to complete', (done) => {
      moan.task('foo', () => Promise.reject('Oops!'))
      moan.task('default', 'foo')

      moan.run()
        .then(() => {
          expect().fail('Should have been rejected')
        })
        .catch(() => {
          expect(moan.hasFailures()).to.be(true)
        })
        .then(done, done)
    })

    context('when the "force" option is enabled', () => {
      it('should return false if all tasks complete successfully', (done) => {
        moan.force = true

        moan.task('foo', [])
        moan.task('default', 'foo')

        moan.run()
          .then(() => {
            expect(moan.hasFailures()).to.be(false)
          })
          .then(done, done)
      })

      it('should return true if at least one task fails to complete', (done) => {
        moan.force = true

        moan.task('foo', () => Promise.reject('Oops!'))
        moan.task('default', 'foo')

        moan.run()
          .then(() => {
            expect(moan.hasFailures()).to.be(true)
          })
          .then(done, done)
      })
    })

    context('when no tasks have been executed', () => {
      it('should act the same as if none have failed', () => {
        moan.task('default', () => Promise.reject())

        expect(moan.hasFailures()).to.be(false)
      })
    })
  })

  describe('#run', () => {
    it('should run all named tasks and their dependencies', (done) => {
      let stack = []

      function track(name) {
        return () => {
          stack.push(name)
        }
      }

      moan.task('bar', [ 'fizz', 'buzz' ], track('bar'))
      moan.task('baz', track('baz'))
      moan.task('buzz', track('buzz'))
      moan.task('fizz', track('fizz'))
      moan.task('foo', 'fu', track('foo'))
      moan.task('fu', [ 'baz' ], track('fu'))

      moan.run([ 'foo', 'bar' ])
        .then(() => {
          expect(stack).to.eql([ 'baz', 'fu', 'foo', 'fizz', 'buzz', 'bar' ])
        })
        .then(done, done)
    })

    it('should pipe the "done" event from Task', (done) => {
      let expected = 'foo'
      let startEmitted = false

      moan.task('default', () => {
        return expected
      })

      moan.on('start', (name) => {
        expect(name).to.be('default')

        startEmitted = true
      })
      moan.on('done', (name, value) => {
        expect(name).to.be('default')
        expect(value).to.be(expected)
        expect(startEmitted).to.be(true)

        done()
      })

      moan.run()
    })

    it('should pipe the "error" event from Task', (done) => {
      let expected = new Error('foo')

      moan.task('default', () => {
        throw expected
      })

      moan.on('error', (name, error) => {
        expect(name).to.be('default')
        expect(error).to.be(expected)

        done()
      })

      moan.run()
    })

    it('should pipe the "start" event from Task', (done) => {
      moan.task('default', [])

      moan.on('start', (name) => {
        expect(name).to.be('default')

        done()
      })

      moan.run()
    })

    it('should throw an error if a task is missing', (done) => {
      moan.task('default', 'foo')

      moan.run()
        .then(() => {
          expect().fail('Should have thrown error')
        })
        .catch((error) => {
          expect(error).to.be.an(Error)
        })
        .then(done, done)
    })

    context('when "force" option is enabled', () => {
      it('should force tasks to run after failures', (done) => {
        let expected = 'foo'

        moan.force = true

        moan.task('bar', () => {
          throw new Error('bar')
        })
        moan.task('foo', 'bar', () => expected)

        moan.run('foo')
          .then((value) => {
            expect(value).to.be(expected)
          })
          .then(done, done)
      })
    })

    context('when no task names are provided', () => {
      it('should run the "default" task', (done) => {
        moan.task('default', () => {
          done()
        })

        moan.run()
      })

      it('should throw an error if there is no the "default" task', (done) => {
        moan.run()
          .then(() => {
            expect().fail('Should have thrown error')
          })
          .catch((error) => {
            expect(error).to.be.an(Error)
          })
          .then(done, done)
      })
    })

    context('when a single task name is provided', () => {
      it('should run the named task', (done) => {
        moan.task('foo', () => {
          done()
        })

        moan.run('foo')
      })
    })

    context('when multiple task names are provided', () => {
      it('should run all named tasks', (done) => {
        let stack = []

        moan.task('bar', () => {
          stack.push('bar')
        })
        moan.task('foo', () => {
          stack.push('foo')
        })

        moan.run([ 'foo', 'bar' ])
          .then(() => {
            expect(stack).to.eql([ 'foo', 'bar' ])
          })
          .then(done, done)
      })
    })

    context('when a cyclic dependency is found', () => {
      it('should throw an error', (done) => {
        moan.task('cyclic', 'default')
        moan.task('default', 'cyclic')

        moan.run()
          .then(() => {
            expect().fail('Should have thrown error')
          })
          .catch((error) => {
            expect(error).to.be.an(Error)
          })
          .then(done, done)
      })
    })
  })

  describe('#task', () => {
    context('when only task name is provided', () => {
      it('should return registered task', () => {
        let task = moan.task('foo', [])

        expect(moan.task('foo')).to.be(task)
      })

      it('should throw an error if task does not exist', () => {
        expect(moan.task.bind(moan)).withArgs('foo').to.throwError()
      })
    })

    context('when task name is provided with dependencies and runnable', () => {
      it('should return newly created task', () => {
        let name = 'foo'
        let dependencies = [ 'fu', 'baz' ]
        function runnable() {}

        let task = moan.task(name, dependencies, runnable)

        expect(task).to.be.a(Task)
        expect(task.name).to.be(name)
        expect(task.dependencies).to.eql(dependencies)
        expect(task.runnable).to.be(runnable)

        expect(moan.task(name)).to.be(task)
      })

      it('should replace any previously registered task', () => {
        let task = moan.task('foo', 'fu')

        expect(task).to.be.a(Task)
        expect(task.dependencies).to.eql([ 'fu' ])

        expect(moan.task('foo')).to.be(task)

        let replacement = moan.task('foo', 'baz')

        expect(replacement).to.be.a(Task)
        expect(replacement.dependencies).to.eql([ 'baz' ])

        expect(moan.task('foo')).to.be(replacement)
      })
    })
  })

  describe('#tasks', () => {
    it('should be contain all unique registered tasks', () => {
      moan.task('foo', [])
      moan.task('bar', [])
      moan.task('foo', [])

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