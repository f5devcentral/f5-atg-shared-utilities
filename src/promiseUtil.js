/*
 * Copyright 2021. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
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
