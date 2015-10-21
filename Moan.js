/*
 * moan
 * https://github.com/neocotic/moan
 *
 * Copyright (c) 2015 Alasdair Mercer
 * Licensed under the MIT license.
 * https://github.com/neocotic/moan/blob/master/LICENSE.md
 */

'use strict'

const moan = require('./lib/moan')

moan.fileSet('instrumentedTestFiles', 'coverage/test/**/*.spec.js')
moan.fileSet('istanbulFiles', [ 'coverage/', 'html-report/', 'lcov.info' ])
moan.fileSet('lintFiles', [ 'lib/', 'task/', 'test/', 'Moan.js' ])
moan.fileSet('sourceFiles', 'lib/**/*.js')
moan.fileSet('testFiles', 'test/**/*.spec.js')

moan.task('clean', require('./task/clean'))
moan.task('coverage', 'instrument', require('./task/coverage'))
moan.task('coveralls', 'coverage', require('./task/coveralls'))
moan.task('instrument', 'clean', require('./task/instrument'))
moan.task('lint', require('./task/lint'))
moan.task('unit-test', require('./task/unit-test'))

moan.task('default', 'test')
moan.task('test', [ 'lint', 'unit-test', 'coverage' ])