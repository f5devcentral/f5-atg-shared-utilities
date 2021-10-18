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

const assert = require('assert');

const arrayUtils = require('../../src/arrayUtils');

describe('arrayUtils', () => {
    describe('.ensureArray', () => {
        it('should return an empty array', () => {
            assert.deepStrictEqual(arrayUtils.ensureArray(), []);
        });

        it('should return an empty array', () => {
            assert.deepStrictEqual(arrayUtils.ensureArray({}), [{}]);
        });

        it('should return an array with values in it', () => {
            assert.deepStrictEqual(arrayUtils.ensureArray({ foo: 'bar' }), [{ foo: 'bar' }]);
        });

        it('should return the same object as before', () => {
            assert.deepStrictEqual(arrayUtils.ensureArray(['foo-bar']), ['foo-bar']);
        });
    });
});
