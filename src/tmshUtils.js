/**
 * Copyright 2023 F5 Networks, Inc.
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

function parseTmshResponse(response) {
    const keyVals = response.split(/\s+/);
    const result = {};

    // find the parts inside the {}
    const openingBraceIndex = keyVals.indexOf('{');
    const closingBraceIndex = keyVals.lastIndexOf('}');

    for (let i = openingBraceIndex + 1; i < closingBraceIndex - 1; i += 2) {
        result[keyVals[i]] = keyVals[i + 1];
    }

    return result;
}

function executeTmshCommand(command, flags) {
    return new Promise((resolve, reject) => {
        const commandName = '/usr/bin/tmsh';
        const commandArgs = (flags || ['-a']).concat(command.split(' '));
        let result = '';
        let error = '';
        const cp = childProcess.spawn(commandName, commandArgs, { shell: '/bin/bash' });

        cp.stdout.on('data', (data) => {
            result += data;
        });

        cp.stderr.on('data', (data) => {
            error += data;
        });

        cp.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(error));
            }

            resolve(parseTmshResponse(result));
        });
    });
}

module.exports = {
    executeTmshCommand
};
