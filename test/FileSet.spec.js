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
const mockery = require('mockery')
const sinon = require('sinon')

describe('FileSet', () => {
  let FileSet
  let stubDel
  let stubGlobby

  beforeEach(() => {
    mockery.enable({
      useCleanCache: true,
      warnOnReplace: false,
      warnOnUnregistered: false
    })

    stubDel = sinon.stub()
    stubGlobby = sinon.stub()

    mockery.registerMock('del', stubDel)
    mockery.registerMock('globby', stubGlobby)

    FileSet = require('../src/FileSet')
  })

  afterEach(() => {
    mockery.disable()
  })

  it('should extend from EventEmitter', () => {
    let fileSet = new FileSet()

    expect(fileSet).to.be.an(EventEmitter)
  })

  describe('#constructor', () => {
    it('should setup class correctly', () => {
      let patterns = [ '**/*.md', '**/*.txt' ]
      let options = { nocase: true, nodir: true }

      let fileSet = new FileSet(patterns, options)

      expect(fileSet.patterns).to.eql(patterns)
    })

    context('when nothing is provided', () => {
      it('should have no patterns', () => {
        let fileSet = new FileSet()

        expect(fileSet.patterns).to.eql([])
      })
    })

    context('when string is used for patterns', () => {
      it('should have a single pattern', () => {
        let options = { nocase: true, nodir: true }

        let fileSet = new FileSet('**/*.md', options)

        expect(fileSet.patterns).to.eql([ '**/*.md' ])
      })
    })
  })

  describe('#del', () => {
    context('when successful', () => {
      it('should use "del" module and pass the correct glob patterns and options', (done) => {
        let expected = [ 'bar.txt', 'baz.md', 'foo.txt', 'fu.md' ]
        let patterns = [ '**/*.md', '**/*.txt' ]
        let options = { nocase: true, nodir: true }
        let fileSet = new FileSet(patterns, options)

        stubDel.withArgs(patterns, options).returns(Promise.resolve(expected))

        fileSet.del()
          .then((files) => {
            expect(files).to.eql(expected)

            done()
          })
          .catch(done)
      })

      it('should emit a "deleted" event', (done) => {
        let expected = [ 'bar.txt', 'baz.md', 'foo.txt', 'fu.md' ]
        let patterns = [ '**/*.md', '**/*.txt' ]
        let fileSet = new FileSet(patterns)

        stubDel.withArgs(patterns, {}).returns(Promise.resolve(expected))

        fileSet.on('deleted', (files) => {
          expect(files).to.eql(expected)

          done()
        })

        fileSet.del()
          .catch(done)
      })
    })

    context('when unsuccessful', () => {
      it('should propagate errors correctly from the "del" module', (done) => {
        let expected = new Error('foo')
        let patterns = [ '**/*.md', '**/*.txt' ]
        let fileSet = new FileSet(patterns)

        stubDel.withArgs(patterns, {}).returns(Promise.reject(expected))

        fileSet.del()
          .then(() => {
            expect().fail('Should have been rejected')

            done()
          })
          .catch((error) => {
            expect(error).to.be(expected)

            done()
          })
      })

      it('should emit an "error" event', (done) => {
        let expected = new Error('foo')
        let patterns = [ '**/*.md', '**/*.txt' ]
        let fileSet = new FileSet(patterns)

        stubDel.withArgs(patterns, {}).returns(Promise.reject(expected))

        fileSet.on('error', (error) => {
          expect(error).to.eql(expected)

          done()
        })

        fileSet.del()
          .then(() => {
            expect().fail('Should have been rejected')

            done()
          })
      })
    })
  })

  describe('#expand', () => {
    it('should extend FileSet correctly', () => {
      let patterns = [ '**/*.md', '**/*.txt' ]
      let options = { nocase: true }
      let otherPatterns = [ '**/*.1st', '**/*.doc' ]
      let otherOptions = { dir: true }

      let fileSet = new FileSet(patterns, options)
      let copy = fileSet.expand(otherPatterns, otherOptions)

      expect(copy.patterns).to.eql(patterns.concat(otherPatterns))
    })

    context('when nothing is provided and original has no patterns', () => {
      it('should have no patterns', () => {
        let fileSet = new FileSet()
        let copy = fileSet.expand()

        expect(copy.patterns).to.eql([])
      })
    })

    context('when nothing is provided and original has patterns', () => {
      it('should have only the patterns of the original', () => {
        let patterns = [ '**/*.md', '**/*.txt' ]
        let options = { nocase: true, nodir: true }

        let fileSet = new FileSet(patterns, options)
        let copy = fileSet.expand()

        expect(copy.patterns).to.eql(patterns)
      })
    })

    context('when string is used for patterns and original has no patterns', () => {
      it('should have a single pattern', () => {
        let fileSet = new FileSet()
        let copy = fileSet.expand('**/*.md')

        expect(copy.patterns).to.eql([ '**/*.md' ])
      })
    })

    context('when string is used for patterns and origina has patterns', () => {
      it('should extend the patterns of the original', () => {
        let patterns = [ '**/*.md', '**/*.txt' ]
        let options = { nocase: true }
        let otherPattern = '**/*.1st'
        let otherOptions = { dir: true }

        let fileSet = new FileSet(patterns, options)
        let copy = fileSet.expand(otherPattern, otherOptions)

        expect(copy.patterns).to.eql(patterns.concat(otherPattern))
      })
    })
  })

  describe('#first', () => {
    context('when successful', () => {
      it('should use "globby" module and pass the correct glob patterns and options', (done) => {
        let expected = 'bar.txt'
        let files = [ expected, 'baz.md', 'foo.txt', 'fu.md' ]
        let patterns = [ '**/*.md', '**/*.txt' ]
        let options = { nocase: true, nodir: true }
        let fileSet = new FileSet(patterns, options)

        stubGlobby.withArgs(patterns, options).returns(Promise.resolve(files))

        fileSet.first()
          .then((file) => {
            expect(file).to.eql(expected)

            done()
          })
          .catch(done)
      })

      it('should emit a "found" event', (done) => {
        let expected = [ 'bar.txt' ]
        let files = expected.concat([ 'baz.md', 'foo.txt', 'fu.md' ])
        let patterns = [ '**/*.md', '**/*.txt' ]
        let fileSet = new FileSet(patterns)

        stubGlobby.withArgs(patterns, {}).returns(Promise.resolve(files))

        fileSet.on('found', (files) => {
          expect(files).to.eql(expected)

          done()
        })

        fileSet.first()
          .catch(done)
      })
    })

    context('when unsuccessful', () => {
      it('should propagate errors correctly from the "globby" module', (done) => {
        let expected = new Error('foo')
        let patterns = [ '**/*.md', '**/*.txt' ]
        let fileSet = new FileSet(patterns)

        stubGlobby.withArgs(patterns, {}).returns(Promise.reject(expected))

        fileSet.first()
          .then(() => {
            expect().fail('Should have been rejected')

            done()
          })
          .catch((error) => {
            expect(error).to.be(expected)

            done()
          })
      })

      it('should emit an "error" event', (done) => {
        let expected = new Error('foo')
        let patterns = [ '**/*.md', '**/*.txt' ]
        let fileSet = new FileSet(patterns)

        stubGlobby.withArgs(patterns, {}).returns(Promise.reject(expected))

        fileSet.on('error', (error) => {
          expect(error).to.eql(expected)

          done()
        })

        fileSet.first()
          .then(() => {
            expect().fail('Should have been rejected')

            done()
          })
      })
    })
  })

  describe('#get', () => {
    context('when successful', () => {
      it('should use "globby" module and pass the correct glob patterns and options', (done) => {
        let expected = [ 'bar.txt', 'baz.md', 'foo.txt', 'fu.md' ]
        let patterns = [ '**/*.md', '**/*.txt' ]
        let options = { nocase: true, nodir: true }
        let fileSet = new FileSet(patterns, options)

        stubGlobby.withArgs(patterns, options).returns(Promise.resolve(expected))

        fileSet.get()
          .then((files) => {
            expect(files).to.eql(expected)

            done()
          })
          .catch(done)
      })

      it('should emit a "found" event', (done) => {
        let expected = [ 'bar.txt', 'baz.md', 'foo.txt', 'fu.md' ]
        let patterns = [ '**/*.md', '**/*.txt' ]
        let fileSet = new FileSet(patterns)

        stubGlobby.withArgs(patterns, {}).returns(Promise.resolve(expected))

        fileSet.on('found', (files) => {
          expect(files).to.eql(expected)

          done()
        })

        fileSet.get()
          .catch(done)
      })
    })

    context('when unsuccessful', () => {
      it('should propagate errors correctly from the "globby" module', (done) => {
        let expected = new Error('foo')
        let patterns = [ '**/*.md', '**/*.txt' ]
        let fileSet = new FileSet(patterns)

        stubGlobby.withArgs(patterns, {}).returns(Promise.reject(expected))

        fileSet.get()
          .then(() => {
            expect().fail('Should have been rejected')

            done()
          })
          .catch((error) => {
            expect(error).to.be(expected)

            done()
          })
      })

      it('should emit an "error" event', (done) => {
        let expected = new Error('foo')
        let patterns = [ '**/*.md', '**/*.txt' ]
        let fileSet = new FileSet(patterns)

        stubGlobby.withArgs(patterns, {}).returns(Promise.reject(expected))

        fileSet.on('error', (error) => {
          expect(error).to.eql(expected)

          done()
        })

        fileSet.get()
          .then(() => {
            expect().fail('Should have been rejected')

            done()
          })
      })
    })
  })

  describe('#last', () => {
    context('when successful', () => {
      it('should use "globby" module and pass the correct glob patterns and options', (done) => {
        let expected = 'fu.md'
        let files = [ 'bar.txt', 'baz.md', 'foo.txt', expected ]
        let patterns = [ '**/*.md', '**/*.txt' ]
        let options = { nocase: true, nodir: true }
        let fileSet = new FileSet(patterns, options)

        stubGlobby.withArgs(patterns, options).returns(Promise.resolve(files))

        fileSet.last()
          .then((file) => {
            expect(file).to.eql(expected)

            done()
          })
          .catch(done)
      })

      it('should emit a "found" event', (done) => {
        let expected = [ 'fu.md' ]
        let files = [ 'bar.txt', 'baz.md', 'foo.txt' ].concat(expected)
        let patterns = [ '**/*.md', '**/*.txt' ]
        let fileSet = new FileSet(patterns)

        stubGlobby.withArgs(patterns, {}).returns(Promise.resolve(files))

        fileSet.on('found', (files) => {
          expect(files).to.eql(expected)

          done()
        })

        fileSet.last()
          .catch(done)
      })
    })

    context('when unsuccessful', () => {
      it('should propagate errors correctly from the "globby" module', (done) => {
        let expected = new Error('foo')
        let patterns = [ '**/*.md', '**/*.txt' ]
        let fileSet = new FileSet(patterns)

        stubGlobby.withArgs(patterns, {}).returns(Promise.reject(expected))

        fileSet.last()
          .then(() => {
            expect().fail('Should have been rejected')

            done()
          })
          .catch((error) => {
            expect(error).to.be(expected)

            done()
          })
      })

      it('should emit an "error" event', (done) => {
        let expected = new Error('foo')
        let patterns = [ '**/*.md', '**/*.txt' ]
        let fileSet = new FileSet(patterns)

        stubGlobby.withArgs(patterns, {}).returns(Promise.reject(expected))

        fileSet.on('error', (error) => {
          expect(error).to.eql(expected)

          done()
        })

        fileSet.last()
          .then(() => {
            expect().fail('Should have been rejected')

            done()
          })
      })
    })
  })

  describe('#patterns', () => {
    it('should be read-only', () => {
      let patterns = [ '**/*.md', '**/*.txt' ]

      let fileSet = new FileSet(patterns)
      try {
        fileSet.patterns = [ '**/*.1st' ]

        expect().fail('Should have thrown error')
      } catch (error) {
        expect(error).to.be.a(TypeError)
      }
    })

    it('should not allow modifications', () => {
      let patterns = [ '**/*.md', '**/*.txt' ]

      let fileSet = new FileSet(patterns)
      fileSet.patterns.push('**/*.1st')

      expect(fileSet.patterns).to.eql(patterns)
    })
  })
})