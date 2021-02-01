/*
 * Copyright 2021. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';


const sinon = require('sinon');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const assert = chai.assert;

const promiseUtil = require('../../src/promiseUtils.js');

describe('promiseUtil', () => {
    describe('.raceSuccess', () => {
        function genPromises(times, fail) {
            return times.map((time, i) => new Promise((resolve, reject) => {
                setTimeout(() => {
                    if (fail) {
                        reject(new Error(`Promise ${i + 1}`));
                    } else {
                        resolve(`Promise ${i + 1}`);
                    }
                }, time);
            }));
        }

        it('should resolve with first promise to resolve', () => Promise.all([
            promiseUtil.raceSuccess(genPromises([1, 5])),
            promiseUtil.raceSuccess(genPromises([5, 1]))
        ]).then((results) => {
            assert.strictEqual(
                results[0],
                'Promise 1',
                'First promise (1ms) did not resolve before second promise (2ms)'
            );
            assert.strictEqual(
                results[1],
                'Promise 2',
                'Second promise (1ms) did not resolve before first promise (2ms)'
            );
        }));

        it('should resolve with only one promise', () => promiseUtil.raceSuccess(
            genPromises([1, 1, 1, 1])
        ).then((result) => {
            assert.strictEqual(typeof result, 'string', 'Promise should resolve with a string');
        }));

        it('should reject with all errors if no promise resolves', () => promiseUtil.raceSuccess(
            genPromises([1, 2], true)
        ).then(() => {
            assert.fail('Promise should not resolve');
        }).catch((errors) => {
            assert.strictEqual(
                Array.isArray(errors),
                true,
                'Promise should reject with an array of errors'
            );
        }));
    });

    describe('.retryPromise', () => {
        it('should run the function 5 times', () => {
            const retry = sinon.spy(promiseUtil, 'retryPromise');
            const options = {
                delay: 2,
                retries: 4
            };

            const fn = () => Promise.reject(new Error('I should fail'));

            return assert.isRejected(promiseUtil.retryPromise(fn, options),
                /I should fail/)
                .then(() => {
                    assert.strictEqual(retry.callCount, 5);
                });
        });

        it('should pass arguments to the supplied function', () => {
            const options = {
                delay: 1,
                retries: 0
            };

            let passedArg1;
            let passedArg2;
            const fn = (arg1, arg2) => {
                passedArg1 = arg1;
                passedArg2 = arg2;
                return Promise.resolve();
            };

            assert.isFulfilled(promiseUtil.retryPromise(fn, options, ['hello', 'world']));
            assert.strictEqual(passedArg1, 'hello');
            assert.strictEqual(passedArg2, 'world');
        });
    });
});
