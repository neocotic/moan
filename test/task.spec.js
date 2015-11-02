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

const Task = require('../src/Task')

describe('Task', () => {
  let name = 'foo'

  it('should extend from EventEmitter', () => {
    let task = new Task(name)

    expect(task).to.be.an(EventEmitter)
  })

  describe('#constructor', () => {
    it('should setup class correctly', () => {
      let dependencies = [ 'fu', 'baz' ]
      function runnable() {}

      let task = new Task(name, dependencies, runnable)

      expect(task.name).to.be(name)
      expect(task.dependencies).to.eql(dependencies)
      expect(task.runnable).to.be(runnable)
      expect(task.finished).not.to.be.ok()
      expect(task.error).not.to.be.ok()
      expect(task.started).not.to.be.ok()
      expect(task.failed).not.to.be.ok()
    })

    context('when only name is provided', () => {
      it('should have no dependencies and a no-op runnable', () => {
        let task = new Task(name)

        expect(task.name).to.be(name)
        expect(task.dependencies).to.eql([])
        expect(task.runnable).to.be.a(Function)
        expect(task.finished).not.to.be.ok()
        expect(task.error).not.to.be.ok()
        expect(task.started).not.to.be.ok()
        expect(task.failed).not.to.be.ok()
      })
    })

    context('when only name and dependencies are provided', () => {
      it('should have a no-op runnable', () => {
        let dependencies = [ 'fu', 'baz' ]

        let task = new Task(name, dependencies)

        expect(task.name).to.be(name)
        expect(task.dependencies).to.eql(dependencies)
        expect(task.runnable).to.be.a(Function)
        expect(task.finished).not.to.be.ok()
        expect(task.error).not.to.be.ok()
        expect(task.started).not.to.be.ok()
        expect(task.failed).not.to.be.ok()
      })
    })

    context('when only name and runnable are provided', () => {
      it('should have no dependencies', () => {
        function runnable() {}

        let task = new Task(name, runnable)

        expect(task.name).to.be(name)
        expect(task.dependencies).to.eql([])
        expect(task.runnable).to.be(runnable)
        expect(task.finished).not.to.be.ok()
        expect(task.error).not.to.be.ok()
        expect(task.started).not.to.be.ok()
        expect(task.failed).not.to.be.ok()
      })
    })

    context('when string is used for dependencies', () => {
      it('should have a single dependency', () => {
        function runnable() {}

        let task = new Task(name, 'bar', runnable)

        expect(task.name).to.be(name)
        expect(task.dependencies).to.eql([ 'bar' ])
        expect(task.runnable).to.be(runnable)
        expect(task.finished).not.to.be.ok()
        expect(task.error).not.to.be.ok()
        expect(task.started).not.to.be.ok()
        expect(task.failed).not.to.be.ok()
      })
    })
  })

  describe('#dependencies', () => {
    it('should be read-only', () => {
      let task = new Task(name, [ 'fu', 'baz' ])

      try {
        task.dependencies = [ 'bar' ]

        expect().fail('Should have thrown error')
      } catch (error) {
        expect(error).to.be.a(TypeError)
      }
    })

    it('should not allow modifications', () => {
      let task = new Task(name)

      task.dependencies.push('bar')

      expect(task.dependencies).to.eql([])
    })
  })

  describe('#error', () => {
    it('should be read-only', () => {
      let task = new Task(name)

      try {
        task.error = new Error('bar')

        expect().fail('Should have thrown error')
      } catch (error) {
        expect(error).to.be.a(TypeError)
      }
    })
  })

  describe('#failed', () => {
    it('should be read-only', () => {
      let task = new Task(name)

      try {
        task.failed = true

        expect().fail('Should have thrown error')
      } catch (error) {
        expect(error).to.be.a(TypeError)
      }
    })
  })

  describe('#finished', () => {
    it('should be read-only', () => {
      let task = new Task(name)

      try {
        task.finished = true

        expect().fail('Should have thrown error')
      } catch (error) {
        expect(error).to.be.a(TypeError)
      }
    })
  })

  describe('#name', () => {
    it('should be read-only', () => {
      let task = new Task(name)

      try {
        task.name = 'bar'

        expect().fail('Should have thrown error')
      } catch (error) {
        expect(error).to.be.a(TypeError)
      }
    })
  })

  describe('#result', () => {
    it('should thrown an error if not finished', () => {
      /* eslint no-unused-expressions: 0 */
      let task = new Task(name)

      try {
        task.result

        expect().fail('Should have thrown error')
      } catch (error) {
        expect(error).to.be.a(Error)
      }
    })

    it('should be read-only', () => {
      let task = new Task(name)

      try {
        task.result = {}

        expect().fail('Should have thrown error')
      } catch (error) {
        expect(error).to.be.a(TypeError)
      }
    })
  })

  describe('#run', () => {
    context('when operation is asynchronous using callback', () => {
      it('should handle successful outcome', (done) => {
        let task = new Task(name, (callback) => {
          callback()
        })

        task.run()
          .then((actual) => {
            expect(actual).to.be(undefined)
          })
          .then(done, done)
      })

      it('should handle successful outcome with result', (done) => {
        let expected = 'bar'
        let task = new Task(name, (callback) => {
          callback(null, expected)
        })

        task.run()
          .then((actual) => {
            expect(actual).to.be(expected)
          })
          .then(done, done)
      })

      it('should handle errors', (done) => {
        let expected = new Error('bar')
        let task = new Task(name, (callback) => {
          callback(expected)
        })

        task.run()
          .then(() => {
            expect().fail('Should have been passed error')
          })
          .catch((actual) => {
            expect(actual).to.be(expected)
          })
          .then(done, done)
      })
    })

    context('when operation is asynchronous using promise', () => {
      it('should handle successful outcome', (done) => {
        let task = new Task(name, () => Promise.resolve())

        task.run()
          .then((actual) => {
            expect(actual).to.be(undefined)
          })
          .then(done, done)
      })

      it('should handle successful outcome with result', (done) => {
        let expected = 'bar'
        let task = new Task(name, () => Promise.resolve(expected))

        task.run()
          .then((actual) => {
            expect(actual).to.be(expected)
          })
          .then(done, done)
      })

      it('should handle errors', (done) => {
        let expected = new Error('bar')
        let task = new Task(name, () => Promise.reject(expected))

        task.run()
          .then(() => {
            expect().fail('Should have been rejected')
          })
          .catch((actual) => {
            expect(actual).to.be(expected)
          })
          .then(done, done)
      })
    })

    context('when operation is synchronous', () => {
      it('should handle successful outcome', (done) => {
        let task = new Task(name)

        task.run()
          .then((actual) => {
            expect(actual).to.be(undefined)
          })
          .then(done, done)
      })

      it('should handle successful outcome with result', (done) => {
        let expected = 'bar'
        let task = new Task(name, () => expected)

        task.run()
          .then((actual) => {
            expect(actual).to.be(expected)
          })
          .then(done, done)
      })

      it('should handle errors', (done) => {
        let expected = new Error('bar')
        let task = new Task(name, () => {
          throw expected
        })

        task.run()
          .then(() => {
            expect().fail('Should have thrown an error')
          })
          .catch((actual) => {
            expect(actual).to.be(expected)
          })
          .then(done, done)
      })
    })

    context('when called multiple times', () => {
      it('should return the same promise as the first call', (done) => {
        let task = new Task(name)

        let first = task.run()
        let second = task.run()

        expect(second).to.be(first)

        first
          .then(() => {
            let third = task.run()

            expect(third).to.be(first)
          })
          .then(done, done)
      })
    })

    context('when operation begins', () => {
      it('should emit a "start" event', (done) => {
        let startEmitted = false
        let task = new Task(name)

        task.on('start', () => {
          startEmitted = true
        })
        task.on('done', () => {
          expect(startEmitted).to.be.ok()

          done()
        })

        task.run()
      })
    })

    context('when operation completed successfully', () => {
      it('should be reflected in the task', (done) => {
        let task = new Task(name)

        let promise = task.run()

        expect(task.started).to.be.ok()

        promise
          .then(() => {
            expect(task.error).not.to.be.ok()
            expect(task.failed).not.to.be.ok()
            expect(task.finished).to.be.ok()
            expect(task.result).not.to.be.ok()
          })
          .then(done, done)
      })

      it('should emit a "done" event', (done) => {
        let task = new Task(name)

        task.on('done', (actual) => {
          expect(actual).to.be(undefined)

          done()
        })

        task.run()
      })
    })

    context('when operation completed successfully with result', () => {
      it('should be reflected in the task', (done) => {
        let expected = 'bar'
        let task = new Task(name, () => expected)

        let promise = task.run()

        expect(task.started).to.be.ok()

        promise
          .then(() => {
            expect(task.error).not.to.be.ok()
            expect(task.failed).not.to.be.ok()
            expect(task.finished).to.be.ok()
            expect(task.result).to.be(expected)
          })
          .then(done, done)
      })

      it('should emit a "done" event', (done) => {
        let expected = 'bar'
        let task = new Task(name, () => expected)

        task.on('done', (actual) => {
          expect(actual).to.be(expected)

          done()
        })

        task.run()
      })
    })

    context('when operation failed to complete', () => {
      it('should be reflected in the task', (done) => {
        let expected = new Error('bar')
        let task = new Task(name, () => {
          throw expected
        })

        let promise = task.run()

        expect(task.started).to.be.ok()

        promise
          .then(() => {
            expect().fail('Should have thrown error')
          })
          .catch(() => {
            expect(task.error).to.be(expected)
            expect(task.failed).to.be.ok()
            expect(task.finished).to.be.ok()
            expect(task.result).not.to.be.ok()
          })
          .then(done, done)
      })

      it('should emit a "error" event', (done) => {
        let expected = new Error('bar')
        let task = new Task(name, () => {
          throw expected
        })

        task.on('error', (actual) => {
          expect(actual).to.be(expected)

          done()
        })

        task.run()
      })
    })
  })

  describe('#runnable', () => {
    it('should be read-only', () => {
      let task = new Task(name)

      try {
        task.runnable = () => {}

        expect().fail('Should have thrown error')
      } catch (error) {
        expect(error).to.be.a(TypeError)
      }
    })
  })

  describe('#started', () => {
    it('should be read-only', () => {
      let task = new Task(name)

      try {
        task.started = true

        expect().fail('Should have thrown error')
      } catch (error) {
        expect(error).to.be.a(TypeError)
      }
    })
  })
})