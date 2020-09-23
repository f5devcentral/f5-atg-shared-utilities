# atg-shared-utilities

This project holds a number of generic utility functions that can be shared across the F5 Automation Toolchain projects.

## arrayUtils

This collection of utils focuses on generic functions useful to arrays.

### ensureArray(variable)

This function will take a variable, convert it to an array (if it is not an array), and return it. If undefined, it will return `[]`.

## mochaReporters

This is a collection of [custom reporters](https://mochajs.org/api/tutorial-custom-reporter.html) for Mocha.

### elasticSearchReporter

Sends test results to an elastic search host. See the [elasticSearchReporter README](src/mochaReporters/elasticSearchReporter/README.md) for details.