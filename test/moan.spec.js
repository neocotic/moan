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
  let mockLogger

  beforeEach(() => {
    moan = new Moan()
    mockLogger = moan.log = sinon.mock(moan.log)
  })

  it('should extend from EventEmitter', () => {
    expect(moan).to.be.an(EventEmitter)
  })

  describe('#constructor', () => {
    // TODO: Complete unit tests
  })

  describe('#currentTask', () => {
    // TODO: Complete unit tests
  })

  describe('#dependencies', () => {
    // TODO: Complete unit tests
  })

  describe('#failed', () => {
    // TODO: Complete unit tests
  })

  describe('#fileSet', () => {
    // TODO: Complete unit tests
  })

  describe('#fileSets', () => {
    it('should be empty when no file sets have been registered', () => {
      expect(moan.fileSets).to.eql([])
    })

    it('should be contain all unique registered file sets', () => {
      moan.fileSet('foo', [])
      moan.fileSet('bar', [])
      moan.fileSet('foo', [])

      expect(moan.fileSets).to.eql([ 'foo', 'bar' ])
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
    // TODO: Complete unit tests
  })

  describe('#result', () => {
    // TODO: Complete unit tests
  })

  describe('#run', () => {
    // TODO: Complete unit tests
  })

  describe('#started', () => {
    // TODO: Complete unit tests
  })

  describe('#task', () => {
    // TODO: Complete unit tests
  })

  describe('#tasks', () => {
    it('should be empty when no tasks have been registered', () => {
      expect(moan.tasks).to.eql([])
    })

    it('should be contain all unique registered tasks', () => {
      moan.task('foo')
      moan.task('bar')
      moan.task('foo')

      expect(moan.tasks).to.eql([ 'foo', 'bar' ])
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
    it('should match the version in the package descriptor', (done) => {
      fs.readFile('package.json', 'utf8', (error, data) => {
        if (error) {
          done(error)
        } else {
          expect(moan.version).to.be(JSON.parse(data).version)

          done()
        }
      })
    })
  })
})