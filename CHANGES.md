## Version 0.1.3, 2015.11.07

* **cli:** `moan` should emit the correct exit code depending on the execution result [#14](https://github.com/neocotic/moan/issues/14)
* **cli:** `FileSet` should propagate errors from `del` and `globby` modules [#15](https://github.com/neocotic/moan/issues/15)

## Version 0.1.2, 2015.11.07

* **cli:** Fix broken `--list` option [#4](https://github.com/neocotic/moan/issues/4)
* **cli:** Options should be applied to global *and* local moan instances [#9](https://github.com/neocotic/moan/issues/9)
* **cli:** Add more internal debug logging [#10](https://github.com/neocotic/moan/issues/10)
* **cli:** Fix issue where local moan module could not be loaded [#11](https://github.com/neocotic/moan/issues/11)
* **cli:** `CommandLineInterface#parse` should return `Promise` [#12](https://github.com/neocotic/moan/issues/12)
* **docs:** Correct Unix path in `CONTRIBUTING.md` file
* **docs:** Clarify that Node.js v4 is only the minimum version required to use moan

## Version 0.1.1, 2015.11.05

* Rename Moan file (i.e. `Moan.js`) Moaning file (i.e. `Moaning.js`)
* Fix issue where global `moan` module cannot run tasks registered against local `moan` module
* Improve error handling
* Improve success message when `--force` option is used
* Rename test files
* Improve output message of `lint` task

## Version 0.1.0, 2015.11.02

* Initial release