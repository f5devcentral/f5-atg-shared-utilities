/**
 * Copyright 2024 F5, Inc.
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

const http = require('http');
const https = require('https');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const sinon = require('sinon');
const nock = require('nock');

chai.use(chaiAsPromised);
const assert = chai.assert;

const request = require('../../src/request');
const tmshUtil = require('../../src/tmshUtils');

describe('Request', () => {
    beforeEach(() => {
        sinon.spy(http, 'request');
        sinon.spy(https, 'request');
        nock('https://localhost')
            .post('/foo')
            .reply(200, { hello: 'world' }, { 'content-type': 'application/json; charset=utf-8' });

        nock('https://localhost')
            .post('/bar')
            .reply(200, '0123456789abcdef');

        nock('https://localhost')
            .post('/bad')
            .reply(422, 'Unprocessable Content');
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

        it('should set auth to primary admin user when using port 8100 with http', () => {
            const reqOpts = {
                protocol: 'http:',
                host: 'localhost',
                port: 8100,
                method: 'GET',
                path: '/foo'
            };
            return request.send(reqOpts)
                .then(() => {
                    assert.strictEqual(http.request.calledOnce, true);
                    assert.deepEqual(http.request.getCall(0).args[0].auth, 'myPrimaryAdminUser:');
                });
        });

        it('should not touch auth when auth is specified', () => {
            const reqOpts = {
                protocol: 'http:',
                host: 'localhost',
                port: 8100,
                method: 'GET',
                path: '/foo',
                auth: 'admin:'
            };
            return request.send(reqOpts)
                .then(() => {
                    assert.strictEqual(http.request.calledOnce, true);
                    assert.deepEqual(http.request.getCall(0).args[0].auth, 'admin:');
                });
        });

        it('should not touch auth when not using port 8100 with http', () => {
            const reqOpts = {
                protocol: 'http:',
                host: 'localhost',
                port: 8101,
                method: 'GET',
                path: '/foo'
            };
            return request.send(reqOpts)
                .then(() => {
                    assert.strictEqual(http.request.calledOnce, true);
                    assert.deepEqual(http.request.getCall(0).args[0].auth, undefined);
                });
        });

        it('should not touch auth when using port 8100 with https', () => {
            const reqOpts = {
                protocol: 'https:',
                host: 'localhost',
                port: 8100,
                method: 'GET',
                path: '/foo'
            };
            return request.send(reqOpts)
                .then(() => {
                    assert.strictEqual(https.request.calledOnce, true);
                    assert.deepEqual(https.request.getCall(0).args[0].auth, undefined);
                });
        });
    });

    it('should set Content-Length header if there is a body', () => {
        const reqOpts = {
            protocol: 'https:',
            host: 'localhost',
            path: '/foo',
            method: 'POST'
        };
        const body = {
            foo: 'bar'
        };
        return request.send(reqOpts, body)
            .then(() => {
                assert.deepEqual(https.request.calledOnce, true);
                assert.deepEqual(
                    parseInt(https.request.getCall(0).args[0].headers['Content-Length'], 10),
                    JSON.stringify(body).length
                );
            });
    });

    it('should return parsed JSON if content header is application/json', () => {
        const reqOpts = {
            protocol: 'https:',
            host: 'localhost',
            path: '/foo',
            method: 'POST'
        };
        return request.send(reqOpts, 'data')
            .then((responseBody) => {
                assert.deepStrictEqual(responseBody, { hello: 'world' });
            });
    });

    it('should return raw data if content header is not application/json', () => {
        const reqOpts = {
            protocol: 'https:',
            host: 'localhost',
            path: '/bar',
            method: 'POST'
        };
        return request.send(reqOpts, 'data')
            .then((responseBody) => {
                assert.deepStrictEqual(responseBody, '0123456789abcdef');
            });
    });

    it('should respond with useful JSON parsing error', () => {
        nock.cleanAll();

        nock('https://localhost')
            .post('/bar')
            .reply(200, '0123456789abcdef', { 'content-type': 'application/json; charset=utf-8' });

        return request.send(
            {
                protocol: 'https:',
                host: 'localhost',
                path: '/bar',
                method: 'POST'
            }, 'data'
        )
            .then(() => {
                assert.fail('expected failure');
            })
            .catch((error) => {
                assert.strictEqual(error.message, 'body is not JSON: 0123456789abcdef');
            });
    });

    it('should return response object if returnResponseObj option is set to true', () => {
        const reqOpts = {
            protocol: 'https:',
            host: 'localhost',
            path: '/foo',
            method: 'POST'
        };
        return request.send(reqOpts, 'data', { returnResponseObj: true })
            .then((responseBody) => {
                assert.deepStrictEqual(
                    responseBody,
                    {
                        body: {
                            hello: 'world'
                        },
                        headers: {
                            'content-type': 'application/json; charset=utf-8'
                        },
                        statusCode: 200
                    }
                );
            });
    });

    it('should reject if client/server error status code and rejectErrStatusCodes option is set to true', () => {
        const reqOpts = {
            protocol: 'https:',
            host: 'localhost',
            path: '/bad',
            method: 'POST'
        };
        return assert.isRejected(request.send(reqOpts, 'data'), '422 Unprocessable Content');
    });

    it('should resolve if client/server error status code and rejectErrStatusCodes option is set to false', () => {
        const reqOpts = {
            protocol: 'https:',
            host: 'localhost',
            path: '/bad',
            method: 'POST'
        };
        return request.send(reqOpts, 'data', { rejectErrStatusCodes: false })
            .then((body) => {
                assert.strictEqual(body, 'Unprocessable Content');
            });
    });
});
