/*
 * Copyright 2021. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

const assert = require('assert');

const arrayUtils = require('../../src/arrayUtils.js');

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
