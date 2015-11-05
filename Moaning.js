/*
 * moan
 * https://github.com/neocotic/moan
 *
 * Copyright (c) 2015 Alasdair Mercer
 * Licensed under the MIT license.
 * https://github.com/neocotic/moan/blob/master/LICENSE.md
 */

'use strict'

const moan = require('.')

moan.config('coverageDir', 'coverage/')
moan.config('encoding', 'utf8')
moan.config('lineCoverageFile', 'lcov.info')
moan.config('sourceDir', 'src/')
moan.config('testDir', 'test/')

moan.fileSet('clean', [
  moan.config('coverageDir'),
  'html-report/',
  moan.config('lineCoverageFile')
])
moan.fileSet('instrumentedTestFiles', `coverage/${moan.config('testDir')}**/*.spec.js`)
moan.fileSet('lintFiles', [
  moan.config('sourceDir'),
  'task/',
  moan.config('testDir'),
  'Moan.js'
])
moan.fileSet('sourceFiles', `${moan.config('sourceDir')}**/*.js`)
moan.fileSet('testFiles', `${moan.config('testDir')}**/*.spec.js`)

moan.task('clean', require('./task/clean'))
moan.task('coverage', 'instrument', require('./task/coverage'))
moan.task('coveralls', 'coverage', require('./task/coveralls'))
moan.task('instrument', 'clean', require('./task/instrument'))
moan.task('lint', require('./task/lint'))
moan.task('unitTest', require('./task/unitTest'))

moan.task('default', 'test')
moan.task('test', [ 'lint', 'unitTest', 'coverage' ])