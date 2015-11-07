    ooo. .oo.  .oo.    .ooooo.   .oooo.   ooo. .oo.
    `888P"Y88bP"Y88b  d88' `88b `P  )88b  `888P"Y88b
     888   888   888  888   888  .oP"888   888   888
     888   888   888  888   888 d8(  888   888   888
    o888o o888o o888o `Y8bod8P' `Y888""8o o888o o888o

A simple modern task-based JavaScript build system that doesn't try to do too much.

[![Build Status](https://img.shields.io/travis/neocotic/moan/develop.svg?style=flat-square)](https://travis-ci.org/neocotic/moan)
[![Coverage](https://img.shields.io/coveralls/neocotic/moan/develop.svg?style=flat-square)](https://coveralls.io/github/neocotic/moan)
[![Dependency Status](https://img.shields.io/david/neocotic/moan.svg?style=flat-square)](https://david-dm.org/neocotic/moan)
[![Dev Dependency Status](https://img.shields.io/david/dev/neocotic/moan.svg?style=flat-square)](https://david-dm.org/neocotic/moan#info=devDependencies)
[![License](https://img.shields.io/npm/l/moan.svg?style=flat-square)](https://github.com/neocotic/moan/blob/master/LICENSE.md)
[![Release](https://img.shields.io/npm/v/moan.svg?style=flat-square)](https://www.npmjs.com/package/moan)

## Install

Install using [npm](https://www.npmjs.com):

``` bash
$ npm install -g moan
```

Now you can use the `moan` command *anywhere!*

You'll need to have at least [Node.js](https://nodejs.org) v4 or later installed.

## Usage

All you need is a `Moaning.js` file in your project directory and you can start building with moan.

### CLI

Here's how to use the `moan` command:

    Usage: moan [options] <task ...>

    Options:

      -h, --help         output usage information
      -V, --version      output the version number
      -d, --debug        enable debug output
      -f, --file [name]  specify alternative name for the Moaning file
      --force            force tasks to run even after errors
      -l, --list         list all available tasks
      --no-color         disable color output
      --stack            print stack traces for errors

### API

Here's how you can interact in your `Moaning.js` file but take a look at the code to see all that's available.

#### `task(name)`
#### `task(name[, dependencies][, runnable])`
#### `config(key)`
#### `config(key, value)`
#### `fileSet(id)`
#### `fileSet(id, patterns[, options])`
#### `run([names])`

## Example

There's no perfect example of a `Moaning.js` file since every project is different (that's the point of moan!) but, if
you're looking for some inspiration, look at our very own `Moaning.js` file.

Just keep in mind that you can't use a globally installed `moan` to execute our `Moaning.js` file since it uses the
project internals to build itself (see [CONTRIBUTING.md](https://github.com/neocotic/moan/blob/master/CONTRIBUTING.md)
for more information and alternative approach).

## Bugs

If you have any problems with this tool or would like to see changes currently in development you can do so
[here](https://github.com/neocotic/moan/issues).

## Contributors

If you want to contribute, you're a legend! Information on how you can do so can be found in
[CONTRIBUTING.md](https://github.com/neocotic/moan/blob/master/CONTRIBUTING.md). We want your suggestions and pull
requests!

A list of [moan](https://github.com/neocotic/moan) contributors can be found in
[AUTHORS.md](https://github.com/neocotic/moan/blob/master/AUTHORS.md).

## License

Copyright (c) 2015 Alasdair Mercer

See [LICENSE.md](https://github.com/neocotic/moan/blob/master/LICENSE.md) for more information on our MIT license.