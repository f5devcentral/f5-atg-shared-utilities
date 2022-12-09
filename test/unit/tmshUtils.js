/**
 * Copyright 2022 F5 Networks, Inc.
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
const EventEmitter = require('events');

const sinon = require('sinon');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const assert = chai.assert;

const tmshUtils = require('../../src/tmshUtils');

describe('tmshUtils', () => {
    afterEach(() => {
        sinon.restore();
    });

    function getCpMock(data, error) {
        const cp = new EventEmitter();
        cp.stdout = new EventEmitter();
        cp.stderr = new EventEmitter();

        function sendData() {
            if (data) {
                cp.stdout.emit('data', data);
            }
        }

        function sendError() {
            if (error) {
                cp.stderr.emit('data', error);
            }
        }

        function close() {
            const code = error ? 1 : 0;
            cp.emit('close', code);
        }

        setTimeout(sendData, 100);
        setTimeout(sendError, 100);
        setTimeout(close, 200);
        return cp;
    }

    describe('.executeTmshCommand', () => {
        it('should execute command and return parsed response', () => {
            sinon.stub(childProcess, 'spawn').callsFake(() => getCpMock('{ value foo }'));

            return assert.becomes(tmshUtils.executeTmshCommand('foo'), { value: 'foo' });
        });

        it('should return errors if they occur', () => {
            sinon.stub(childProcess, 'spawn').callsFake(() => getCpMock(null, 'this is an error'));

            return assert.isRejected(tmshUtils.executeTmshCommand('foo'), 'this is an error');
        });
    });
});
