# Contributing

If you have any questions about [moan](https://github.com/neocotic/moan) please feel free to
[raise an issue](https://github.com/neocotic/moan/issues/new).

Please [search existing issues](https://github.com/neocotic/moan/issues) for the same feature and/or issue before
raising a new issue. Commenting on an existing issue is usually preferred over raising duplicate issues.

Ensure that all files confirm to the coding standards and that you update any relevant unit tests (in the `test`
directory) and that all tests are currently passing. This can be done easily via command-line:

``` bash
# install/update package dependencies
$ npm install
# run test suite
$ npm test
```

The only dependency here is just [Node.js](https://nodejs.org) v4. Earlier versions *will not work!*

If you have installed `moan` globally, unfortunately, you can't use it to execute our `Moaning.js` file since it uses
the project internal `Moan` singleton instead of one from a `moan` dependency when building itself. Alternatively, you
can simply use `bin/moan` instead (or `node bin\moan` if you're on Windows).

Use the same coding style as the rest of the code base.

All pull requests should be made to the `develop` branch.

Don't forget to add your details to the list of [AUTHORS.md](https://github.com/neocotic/moan/blob/master/AUTHORS.md)
if you want your contribution to be recognized by others.