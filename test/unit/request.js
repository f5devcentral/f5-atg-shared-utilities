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
const http = require('http');
const https = require('https');
const sinon = require('sinon');
const nock = require('nock');

const request = require('../../src/request');
const tmshUtil = require('../../src/tmshUtils');

describe('Request', () => {
    beforeEach(() => {
        sinon.spy(http, 'request');
        sinon.spy(https, 'request');
        nock('https://localhost')
            .post('/foo')
            .reply(200, {});
    });

    afterEach(() => {
        sinon.restore();
        nock.cleanAll();
    });

    describe('auth', () => {
        beforeEach(() => {
            sinon.stub(tmshUtil, 'executeTmshCommand').resolves(
                {
                    value: '"myPrimaryAdminUser"'
                }
            );

            nock('http://localhost:8100')
                .get('/foo')
                .reply(200, {});

            nock('https://localhost:8100')
                .get('/foo')
                .reply(200, {});

            nock('http://localhost:8101')
                .get('/foo')
                .reply(200, {});
        });

        it('should set auth to primary admin user when using port 8100 with http', () => request.send(
            {
                protocol: 'http:',
                host: 'localhost',
                port: 8100,
                method: 'GET',
                path: '/foo'
            }
        )
            .then(() => {
                assert.strictEqual(http.request.calledOnce, true);
                assert.deepEqual(http.request.getCall(0).args[0].auth, 'myPrimaryAdminUser:');
            }));

        it('should not touch auth when auth is specified', () => request.send(
            {
                protocol: 'http:',
                host: 'localhost',
                port: 8100,
                method: 'GET',
                path: '/foo',
                auth: 'admin:'
            }
        )
            .then(() => {
                assert.strictEqual(http.request.calledOnce, true);
                assert.deepEqual(http.request.getCall(0).args[0].auth, 'admin:');
            }));

        it('should not touch auth when not using port 8100 with http', () => request.send(
            {
                protocol: 'http:',
                host: 'localhost',
                port: 8101,
                method: 'GET',
                path: '/foo'
            }
        )
            .then(() => {
                assert.strictEqual(http.request.calledOnce, true);
                assert.deepEqual(http.request.getCall(0).args[0].auth, undefined);
            }));

        it('should not touch auth when using port 8100 with https', () => request.send(
            {
                protocol: 'https:',
                host: 'localhost',
                port: 8100,
                method: 'GET',
                path: '/foo'
            }
        )
            .then(() => {
                assert.strictEqual(https.request.calledOnce, true);
                assert.deepEqual(https.request.getCall(0).args[0].auth, undefined);
            }));
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
