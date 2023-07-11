# atg-shared-utilities

This project holds a number of generic utility functions that can be shared across the F5 Automation Toolchain projects.

## CONTRIBUTIONS

Read through the contributing/README.md for information on how to contribute to this project.

## ipUtils

These utilities will assist in IP address calculations

### minimizeIP(ip)

Minimize zeroes in the string representation of an F5 IPv4/6 address

### isIPv4(ip)

Checks if an address is IPv4

### isIPv6(ip)

Checks if an address is IPv6

### splitAddress(address)

Splits an IPv4 or IPv6 address into an address and port pair

### getCidrFromNetmask(netmask, noSlash)

Returns the CIDR for the given netmask. Optionally returns CIDR without a leading '/'

### parseIpAddress(address)

Parses an IP address into its components: IP, route domain, CIRD, netmask, IP with route

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

Takes a variable, converts it to an array (if it is not an array), and returns it. If undefined, it will return `[]`.

### doesArrayContainAnyOf(array1, array2)

Checks if any member of tArray is present in array.

### doesArrayContain(array, target)

Checks if any member of target is present in array.

### insertAfterOrAtBeginning(array, target, item, comparison)

Inserts an item after another item in an array or at the beginning of the array.

### insertBeforeOrAtBeginning(array, target, item, comparison)

Inserts an item before another item in an array or at the beginning of the array.

### insertAfterOrAtEnd(array, target, item, comparison)

Inserts an item after another item in an array or at the end of the array.

### insertBeforeOrAtEnd(array, target, item, comparison)

Inserts an item before another item in an array or at the end of the array.

## requestUtils

This collection of utils is for sending http requests.

### send(requestOptions, body, options)

Send an http/https request using the options and body. This is a wrapper around [node's http/https](https://nodejs.org/api/https.html#https) request functionality.

## SecureVault

These BIG-IP only functions will use a BIG-IP's radius server to encrypt and decrypt JSON strings for you.

### encrypt(string)

This function will take in a string and return an encrypted array from that string.

### decrypt(string)

This function will take in an encrypted string and return an unencrypted string.

## Tracer

This lib contains classes and functions that facilitate performance tracing, with current implementation using `Jaeger`, which follows OpenTelemetry (see <https://opentelemetry.io/docs/concepts/data-sources/> for basics)

**Performance tracing is not intended for production use**. But since tracing is integrated with the rest of the production code, a `Tracer` has to exist, and will then act as no-op if it's not enabled upon instantiation (default).

### Builds

#### jaeger-client

The `jaeger-client` is listed as an optional dependency and will only be loaded/required at tracer initialization and only if tracing is enabled. This is so that we don't include the modules when creating a production build.

It is recommended that projects use a separate script for creating a trace-enabled build. For example, a production build might be created using `npm run build` which uses `npm ci --only=production --no-optional`, while a perf build might be created using `npm run buildperf` which uses `npm ci --only=production`, which then allows the optional depenedencies to be included.

#### error-package

Jaeger throws an error for older node versions (specifically with dependency `thriftrw -> error`) wherein a read-only name property is being modified. Consequently we had to modify package-lock.json and pin it to 7.2.1., otherwise, `thriftw` uses its own subdirectory of node_modules with the older error version of 7.0.2.

### Settings

There are two ways to enable a tracer upon instantiation:

- by passing through constructor options, or
- by setting env variables
  - This is an option for quick dev debugging or for projects that might not have persisted settings yet.
  - App settings are generally loaded after app start is completed; env variables serve as backup to enable trace and get information early on while app is starting.
  - For projects using iControl REST Framework: restnoded is specific in how it's started and run file needs to be updated to include the env variables)

Example variables:

```
  export F5_PERF_TRACING_ENDPOINT=http://{jaegerHost}:{jaegerPort}/api/traces
  export F5_PERF_TRACING_DEBUG=true
  export F5_PERF_TRACING_ENABLED=true
```

### Usage

Spans

- A span is a basic unit of trace. A span can have other related spans, either at the same level, or as a child span. A child span denotes a subset of some operation(s) done within a parent span.
- A span can have log (events) associated with it, as well as tags (key-value pair of attributes pertaining to the span).
- Sample use given a typical REST endpoint with url `/shared/myProject/myResource/{myResourceId}` which allows POST to create a new resource
  - Using `tracer.startHttpSpan()` at the beginning of the endpoint handler when request is received will create:

    - A new span with the api path `/shared/myProject/myResource/{myResourceId}`.The `{myResourceId}` here is literal - we don't want spans for each resourceId.
    - The relevant http tags (e.g. `http.url:shared/myProject/myResource/resourceId123`, `http.method:POST`)

  - Using `tracer.startChildSpan()` in subsequent operations, (e.g. inside `validateResource()` then again in `createNewResource()`) and passing the previous http span as the parent arg will create those child spans with their own start and end time, tags and events. This allows for further drill down and inspection.

Tracer.close()

- It is important to explicitly call `tracer.close()` when tracer is no longer needed to flush out any pending operations and avoid memory leaks.

## License

[Apache License 2.0](https://choosealicense.com/licenses/apache-2.0/)

## Copyright

Copyright 2014-2023 F5 Networks Inc.
