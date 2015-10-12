     ___ ___     ___      __      ___
    /' __` __`\  / __`\  /'__`\  /' _ `\
    /\ \/\ \/\ \/\ \L\ \/\ \L\.\_/\ \/\ \
    \ \_\ \_\ \_\ \____/\ \__/.\_\ \_\ \_\
     \/_/\/_/\/_/\/___/  \/__/\/_/\/_/\/_/

Simple task-based JavaScript build system

# TODO

* Complete first draft main project (API and CLI)
* Main API methods:
  * `task`: declare a task
  * `externalTask`: declare an external task (e.g. loaded from another file or module)
  * `run`: runs specified task(s)
  * `executed`: checks if specified task(s) has been executed
* Unit tests (with code coverage)
* Release other helper modules
  * moan-logger