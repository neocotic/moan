/*
 * moan
 * https://github.com/neocotic/moan
 *
 * Copyright (c) 2015 Alasdair Mercer
 * Licensed under the MIT license.
 * https://github.com/neocotic/moan/blob/master/LICENSE.md
 */

'use strict'

/**
 * Contains utility methods that can be used throughout the module.
 *
 * @public
 */
module.exports = class Utils {

  /**
   * Always returns an array either containing the specified argument if it's not an array, or the argument itself
   * if it's already an array.
   *
   * If <code>arg</code> is <code>null</code>, then the returned array will be empty.
   *
   * @param {Array|*} arg - the argument to either be returned if it's an array or to be contained as the single
   * element within the returned array
   * @return {Array} Either <code>arg</code> if it's an array or an array containing it if it's not, which will be
   * empty if <code>arg</code> is <code>null</code>.
   * @public
   */
  static asArray(arg) {
    if (arg == null) {
      return []
    }

    return Array.isArray(arg) ? arg : [ arg ]
  }

  /**
   * Always returns a string based on the specified argument.
   *
   * If <code>arg</code> is <code>null</code>, then the returned string will be empty or if it's an array it will
   * produce a comma-separate list of values.
   *
   * @param {Array|*} arg - the argument to either produce a list of comma-separated values from if it's an array or to
   * be returned as a string
   * @return {string} Either a comma-separated list of values of <code>arg</code> is an array or a string
   * representation of it if it's not, which will be empty if <code>arg</code> is <code>null</code>.
   * @public
   */
  static asString(arg) {
    if (arg == null) {
      return ''
    }

    return Array.isArray(arg) ? arg.join(', ') : String(arg)
  }
}