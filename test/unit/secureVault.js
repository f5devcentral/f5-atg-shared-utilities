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

const childProcess = require('child_process');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const nock = require('nock');
const sinon = require('sinon');

const secureVault = require('../../src/secureVault');

chai.use(chaiAsPromised);
const assert = chai.assert;

describe('SecureVault', () => {
    afterEach(() => {
        sinon.restore();
        nock.cleanAll();
    });

    describe('.encrypt()', () => {
        let serverCreated = false;
        beforeEach(() => {
            serverCreated = false;
            sinon.stub(childProcess, 'exec').callsFake((command, cb) => {
                if (!serverCreated) {
                    cb(new Error('Radius server was not created'));
                }

                cb(null, [
                    'auth radius-server server {',
                    '    secret $M$3b$NlfUwuyPSPCCmxW9NicaVg==',
                    '}'
                ].join('\n'));
            });
        });

        function nockRadiusPost() {
            nock('http://localhost:8100')
                .persist()
                .post('/tm/auth/radius-server')
                .reply(200, () => {
                    serverCreated = true;
                    return {};
                });
        }

        function nockRadiusDelete() {
            nock('http://localhost:8100')
                .persist()
                .delete(/^\/tm\/auth\/radius-server/)
                .reply(200);
        }

        it('should handle POST failure', () => {
            const errorMessage = 'Unable to create';
            nock('http://localhost:8100')
                .post('/tm/auth/radius-server')
                .reply(500, errorMessage);
            nockRadiusDelete();

            return assert.isRejected(
                secureVault.encrypt('string'),
                errorMessage
            );
        });

        it('should handle exec failure', () => {
            nockRadiusPost();
            nockRadiusDelete();

            childProcess.exec.restore();
            const errorMessage = 'Unable to exec';
            sinon.stub(childProcess, 'exec').callsArgWith(1, new Error(errorMessage));

            return assert.isRejected(
                secureVault.encrypt('string'),
                errorMessage
            );
        });

        it('should handle bad data from exec', () => {
            nockRadiusPost();
            nockRadiusDelete();

            childProcess.exec.restore();
            const errorMessage = 'mcpd is dead or something';
            sinon.stub(childProcess, 'exec').callsArgWith(1, null, errorMessage);

            return assert.isRejected(
                secureVault.encrypt('string'),
                errorMessage
            );
        });

        it('should handle missing data from exec', () => {
            nockRadiusPost();
            nockRadiusDelete();

            childProcess.exec.restore();
            sinon.stub(childProcess, 'exec').callsFake((command, cb) => {
                cb(null, [
                    'auth radius-server server {',
                    '',
                    '}'
                ].join('\n'));
            });

            return assert.isRejected(
                secureVault.encrypt('string'),
                'Failed to retrieve secret'
            );
        });

        it('should handle DELETE failure', () => {
            const errorMessage = 'Unable to delete';
            nock('http://localhost:8100')
                .persist()
                .delete(/^\/tm\/auth\/radius-server/)
                .reply(500, errorMessage);
            nockRadiusPost();

            return assert.isRejected(
                secureVault.encrypt('string'),
                errorMessage
            );
        });

        function assertCryptogram(input) {
            return Promise.resolve()
                .then(() => secureVault.encrypt(input))
                .then((result) => {
                    assert(result.startsWith('$M$'), 'Result is not a cryptogram');
                });
        }

        it('should generate cryptogram from string', () => {
            nockRadiusPost();
            nockRadiusDelete();

            return assertCryptogram('string');
        });

        it('should generate cryptogram from long string', () => {
            nockRadiusPost();
            nockRadiusDelete();
            return assertCryptogram('$'.repeat(1000));
        });
    });

    describe('.decrypt()', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('should handle exec failure', () => {
            const errorMessage = 'Unable to exec';
            sinon.stub(childProcess, 'exec').callsArgWith(1, new Error(errorMessage));

            return assert.isRejected(
                secureVault.decrypt('$M$'),
                errorMessage
            );
        });

        const decrypted = 'secret';
        it('should decrypt string', () => {
            sinon.stub(childProcess, 'exec').callsArgWith(1, null, decrypted);
            return assert.becomes(secureVault.decrypt('$M$'), decrypted);
        });

        it('should decrypt long string', () => {
            sinon.stub(childProcess, 'exec').callsArgWith(1, null, decrypted);
            return assert.becomes(
                secureVault.decrypt('$M$,$M$'),
                decrypted.repeat(2)
            );
        });
    });
});
