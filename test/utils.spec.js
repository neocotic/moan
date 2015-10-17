/*
 * moan
 * http://neocotic.com/moan
 *
 * Copyright (c) 2015 Alasdair Mercer
 * Licensed under the MIT license.
 * https://github.com/neocotic/moan/blob/master/LICENSE.md
 */

'use strict'

const expect = require('expect.js')

const Utils = require('../lib/utils')

describe('Utils', () => {
  describe('.asArray', () => {
    it('returns an empty array if null or undefined', () => {
      expect(Utils.asArray(null)).to.eql([])
      expect(Utils.asArray(undefined)).to.eql([])
    })

    it('returns argument if an array', () => {
      let array = []

      expect(Utils.asArray(array)).to.be(array)

      array.push('foo', 'bar')

      expect(Utils.asArray(array)).to.be(array)
    })

    it('returns an array containing argument when not an array', () => {
      expect(Utils.asArray('foo')).to.eql([ 'foo' ])
    })
  })

  describe('.asString', () => {
    it('returns an empty string if null or undefined', () => {
      expect(Utils.asString(null)).to.be('')
      expect(Utils.asString(undefined)).to.be('')
    })

    it('returns string representation of argument', () => {
      expect(Utils.asString('foo')).to.be('foo')
      expect(Utils.asString(123)).to.be('123')
      expect(Utils.asString(-987)).to.be('-987')
      expect(Utils.asString(NaN)).to.be('NaN')
      expect(Utils.asString(true)).to.be('true')
    })

    it('returns a list of comma-separated values if argument is an array', () => {
      expect(Utils.asString([])).to.be('')
      expect(Utils.asString([ 'foo' ])).to.be('foo')
      expect(Utils.asString([ 'foo', 'bar' ])).to.be('foo, bar')
    })
  })
})