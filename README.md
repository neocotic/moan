```
. ___ ___     ___      __      ___
/' __` __`\  / __`\  /'__`\  /' _ `\
/\ \/\ \/\ \/\ \L\ \/\ \L\.\_/\ \/\ \
\ \_\ \_\ \_\ \____/\ \__/.\_\ \_\ \_\
 \/_/\/_/\/_/\/___/  \/__/\/_/\/_/\/_/
```

Simple task-based JavaScript build system

> This project is very much a work in progress...

# TODO

- [ ] Complete first draft main project (API and CLI)
- [ ] Main API methods:
  - [x] `task`: declare a task
  - [ ] `externalTask`: declare an external task (e.g. loaded from another file or module)
  - [ ] `run`: runs specified task(s)
  - [ ] `watch`: watch for file changes and execute task(s) or task function
  - [x] `names`: get task names
  - [ ] `dependencies`: get names of dependencies for specified task
- [ ] Add logging ability
- [ ] Unit tests (with code coverage)