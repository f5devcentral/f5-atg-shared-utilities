/**
 * Copyright 2021 F5 Networks, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


'use strict';

/**
 * Promise based timeout function
 *
 * @param {integer} t - Time in milliseconds to wait
 * @param {variable} v - Optional pass through value
 */
const delay = function (t, v) {
    return new Promise(((resolve) => {
        setTimeout(() => {
            resolve(v);
        }, t);
    }));
};

/**
 * Run an array of promise based functions one after the other
 *
 *  @param {function[]} functions - A list of functions that should return promises
 *  @returns {Promise}
 */
const series = function (functions) {
    const results = [];
    return functions.reduce(
        (promise, f) => promise.then(f).then(r => results.push(r)),
        Promise.resolve()
    ).then(() => results);
};

/**
 * Run an array of promise based functions concurrently
 *
 *  @param {function[]} functions - A list of functions that should return promises
 *  @returns {Promise}
 */
const parallel = function (functions) {
    return Promise.all(functions.map(f => f()));
};

/**
 * Run an array of promises and resolve on first promise in array to resolve
 *
 *  @param {Promise[]} promises - A list of promises
 *  @returns {Promise}
 */
function raceSuccess(promises) {
    // If a request fails, count that as a resolution so it will keep
    // waiting for other possible successes. If a request succeeds,
    // treat it as a rejection so Promise.all immediately bails out.
    return Promise.all(promises.map(p => p.then(
        val => Promise.reject(val),
        err => Promise.resolve(err)
    ))).then(
        // If '.all' resolved, we've just got an array of errors.
        errors => Promise.reject(errors),
        // If '.all' rejected, we've got the result we wanted.
        val => Promise.resolve(val)
    );
}

/**
 * Run a function a number of times
 *
 * @param {function} fn - a promise to be retried multiple times
 * @param {object} options - uses, delay and retries as values
 * @param {any[]} args - one argument or a list of arguments to pass to fn
 * @returns {Promise}
 */

function retryPromise(fn, options, args) {
    if (!Array.isArray(args)) {
        args = [args];
    }
    return fn.apply(this, args)
        .catch(err => this.delay(options.delay)
            .then(() => {
                if (options.retries === 0) {
                    throw err;
                }
                options.retries -= 1;
                return this.retryPromise(fn, options, args);
            }, options.delay));
}

module.exports = {
    delay,
    series,
    parallel,
    raceSuccess,
    retryPromise
};
