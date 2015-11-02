/*
 * moan
 * https://github.com/neocotic/moan
 *
 * Copyright (c) 2015 Alasdair Mercer
 * Licensed under the MIT license.
 * https://github.com/neocotic/moan/blob/master/LICENSE.md
 */

'use strict'

const expect = require('expect.js')

const Utils = require('../src/Utils')

describe('Utils', () => {
  describe('.asArray', () => {
    context('when argument is null or undefined', () => {
      it('should return an empty array', () => {
        expect(Utils.asArray(null)).to.eql([])
        expect(Utils.asArray(undefined)).to.eql([])
      })
    })

    context('when argument is an array', () => {
      it('should return argument', () => {
        let array = []

        expect(Utils.asArray(array)).to.be(array)

        array.push('foo', 'bar')

        expect(Utils.asArray(array)).to.be(array)
      })
    })

    context('when argument is not an array', () => {
      it('should return an array containing argument', () => {
        expect(Utils.asArray('foo')).to.eql([ 'foo' ])
      })
    })
  })

  describe('.asString', () => {
    context('when argument is null or undefined', () => {
      it('should return an empty string', () => {
        expect(Utils.asString(null)).to.be('')
        expect(Utils.asString(undefined)).to.be('')
      })
    })

    context('when argument is an array', () => {
      it('should return a string containing comma-separated values', () => {
        expect(Utils.asString([])).to.be('')
        expect(Utils.asString([ 'foo' ])).to.be('foo')
        expect(Utils.asString([ 'foo', 'bar' ])).to.be('foo, bar')
      })
    })

    it('should return a string representation of argument', () => {
      expect(Utils.asString('foo')).to.be('foo')
      expect(Utils.asString(123)).to.be('123')
      expect(Utils.asString(-987)).to.be('-987')
      expect(Utils.asString(NaN)).to.be('NaN')
      expect(Utils.asString(true)).to.be('true')
    })
  })

  describe('.plural', () => {
    context('when count is negative', () => {
      it('should throw a RangeError', () => {
        expect(Utils.plural).withArgs(-1).to.throwError((error) => {
          expect(error).to.be.a(RangeError)
        })
      })
    })

    context('when count is zero', () => {
      it('should return default pluralString', () => {
        expect(Utils.plural(0)).to.be('s')
      })

      it('should return specified pluralString', () => {
        expect(Utils.plural(0, 'foo')).to.be('foo')
      })
    })

    context('when count is one', () => {
      it('should return default singularString', () => {
        expect(Utils.plural(1)).to.be('')
      })

      it('should return specified singularString', () => {
        expect(Utils.plural(1, null, 'foo')).to.be('foo')
      })
    })

    context('when count is more than one', () => {
      it('should return default singularString', () => {
        expect(Utils.plural(2)).to.be('s')
        expect(Utils.plural(20)).to.be('s')
      })

      it('should return specified singularString', () => {
        expect(Utils.plural(2, 'foo')).to.be('foo')
        expect(Utils.plural(20, 'foo')).to.be('foo')
      })
    })
  })
})