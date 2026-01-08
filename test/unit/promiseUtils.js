/**
 * Copyright 2026 F5, Inc.
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

const sinon = require('sinon');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const assert = chai.assert;

const promiseUtil = require('../../src/promiseUtils');

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

    describe('.series', () => {
        it('should call functions in a series and return results in order', () => {
            const called = [];
            const func1 = () => new Promise((resolve) => {
                setTimeout(() => {
                    called.push(1);
                    resolve(10);
                }, 50);
            });
            const func2 = () => new Promise((resolve) => {
                setTimeout(() => {
                    called.push(2);
                    resolve(20);
                }, 10);
            });
            const func3 = () => new Promise((resolve) => {
                setTimeout(() => {
                    called.push(3);
                    resolve(30);
                }, 20);
            });
            return promiseUtil.series([func1, func2, func3])
                .then((results) => {
                    assert.deepStrictEqual(called, [1, 2, 3]);
                    assert.deepStrictEqual(results, [10, 20, 30]);
                });
        });
    });
});
