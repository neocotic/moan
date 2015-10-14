/*
 * moan
 * http://neocotic.com/moan
 *
 * Copyright (c) 2015 Alasdair Mercer
 * Licensed under the MIT license.
 * https://github.com/neocotic/moan/blob/master/LICENSE.md
 */

'use strict'

/**
 * TODO: Document
 *
 * @public
 */
module.exports = class Utils {

  /**
   * Always returns an array either containing the specified argument if it's not an array, or the argument itself
   * if it's already an array.
   *
   * If <code>arg</code> is <code>undefined</code>, then the returned array will be empty.
   *
   * @param {Array|*} arg - the argument to either be returned if it's an array or to be contained as the single
   * element within the returned array
   * @return {Array} Either <code>arg</code> if it's an array or an array containing it if it's not, which will be
   * empty if <code>arg</code> is <code>undefined</code>.
   * @public
   */
  static asArray(arg) {
    if (typeof arg === 'undefined') return []

    return Array.isArray(arg) ? arg : [ arg ]
  }
}