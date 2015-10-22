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

const FileSet = require('../lib/file-set')

describe('FileSet', () => {
  it('should extend from EventEmitter', () => {
    let fileSet = new FileSet()

    expect(fileSet).to.be.an(EventEmitter)
  })

  describe('#constructor', () => {
    it('should setup class correctly', () => {
      let patterns = [ 'fu', 'baz' ]
      let options = { nocase: true }

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
        let options = { nocase: true }

        let fileSet = new FileSet('bar', options)

        expect(fileSet.patterns).to.eql([ 'bar' ])
      })
    })
  })

  // TODO: Complete unit tests
})