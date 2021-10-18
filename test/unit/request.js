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
const https = require('https');
const sinon = require('sinon');
const nock = require('nock');

const request = require('../../src/request');

describe('Request', () => {
    beforeEach(() => {
        sinon.spy(https, 'request');
        nock('https://localhost')
            .post('/foo')
            .reply(200, {});
    });

    afterEach(() => {
        sinon.restore();
        nock.cleanAll();
    });

    it('should set Content-Length header if there is a body', () => {
        const body = {
            foo: 'bar'
        };

        return request.send(
            {
                protocol: 'https:',
                host: 'localhost',
                path: '/foo',
                method: 'POST'
            }, body
        )
            .then(() => {
                assert.deepEqual(https.request.calledOnce, true);
                assert.deepEqual(
                    https.request.getCall(0).args[0].headers['Content-Length'],
                    JSON.stringify(body).length
                );
            });
    });
});
