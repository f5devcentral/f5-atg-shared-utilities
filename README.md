# atg-shared-utilities

This project holds a number of generic utility functions that can be shared across the F5 Automation Toolchain projects.

## CONTRIBUTIONS

Read through the contributing/README.md for information on how to contribute to this project.

## promiseUtils

These utilities will assist in managing promises within your program.

### delay(t, v)

This function delays t (time in milliseconds). Afterwhich it resolves v (optional).

### series(function[])

This function will resolve an array of functions sequentially. Note each function must return a Promise.

### parallel(function[])

This function will resolve an array of functions in parallel. Note each function must return a Promise.

### raceSuccess(Promise[])

This function will run an array of promises. Then resolve with the result of the first Promise that resolves.

### retryPromise(fn, options, args[])

fn - The function to be run.
options - An object with .retries and .delay. Both are required.
args - An array of arguments passed into fn.

This will run the function fn with the arguments args, up to a number of times equal to options.retries, or until a resolve. 

## arrayUtils

This collection of utils focuses on generic functions useful to arrays.

### ensureArray(variable)

This function will take a variable, convert it to an array (if it is not an array), and return it. If undefined, it will return `[]`.

## License

[Apache License 2.0](https://choosealicense.com/licenses/apache-2.0/)

## Copyright

Copyright 2014-2021 F5 Networks Inc.
