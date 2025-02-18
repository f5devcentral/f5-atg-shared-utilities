/**
 * Copyright 2025 F5, Inc.
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

const crypto = require('crypto');
const childProcess = require('child_process');

const request = require('./request');

class SecureVault {
    /**
     * Encrypt data using BIG-IP Secure Vault
     *
     * @param {string} data base64 encoded string
     */
    static encrypt(data) {
        const splitData = data.match(/.{1,500}/g);
        return encryptHelper(splitData, [], 0).then((r) => r.join(','));
    }

    /**
     * Decrypts data encrypted by this module
     *
     *
     * @param {string} encrypted data
     */
    static decrypt(data) {
        return decryptHelper(data.split(','), [], 0);
    }
}

/**
 * Return a promise to execute a bash command on a BIG-IP using
 * child-process.exec.
 * @public
 * @param {string} command - bash command to execute
 * @returns {Promise} - resolves to a string containing the command output
 */
function execBash(command) {
    return new Promise((resolve, reject) => {
        childProcess.exec(command, (error, stdout) => {
            if (error !== null) {
                reject(error);
            } else {
                resolve(stdout);
            }
        });
    });
}

function encryptHelper(dataAra, encryptedDataAra, i) {
    const radiusObjectName = `f5-teem_delete_me_${crypto.randomBytes(6).toString('hex')}`;

    const postOptions = {
        method: 'POST',
        protocol: 'http:',
        host: 'localhost',
        port: 8100,
        path: '/tm/auth/radius-server'
    };
    const postBody = {
        name: radiusObjectName,
        secret: dataAra[i],
        server: 'foo'
    };

    const deleteOptions = {
        method: 'DELETE',
        protocol: 'http:',
        host: 'localhost',
        port: 8100,
        path: `/tm/auth/radius-server/${radiusObjectName}`
    };

    return Promise.resolve()
        .then(() => request.send(postOptions, postBody))
        .then(() => {
            const tmshCmd = `tmsh -a list auth radius-server ${radiusObjectName} secret`;
            return execBash(tmshCmd).then((result) => {
                let parsed = null;
                try {
                    parsed = result.split('\n')[1].trim().split(' ', 2)[1];
                } catch (error) {
                    throw new Error(`Unable to parse secret from TMSH: ${result}`);
                }
                return parsed;
            });
        })
        .then((secret) => {
            encryptedDataAra.push(secret);
            if (typeof encryptedDataAra[i] !== 'string') {
                const message = 'Encryption failed!  Failed to retrieve secret';
                throw new Error(message);
            }
        })
        .then(() => request.send(deleteOptions))
        .then(() => {
            i += 1;
            if (i < dataAra.length) {
                return encryptHelper(dataAra, encryptedDataAra, i);
            }
            return encryptedDataAra;
        })
        .catch((e) => {
            // best effort to delete radius server
            request.send(deleteOptions).catch(() => {});
            throw e;
        });
}

function decryptHelper(encryptedDataAra, dataAra, i) {
    const secret = encryptedDataAra[i].replace(/\$/g, '\\$');
    const php = [
        'coapi_login("admin");',
        '$query_result = coapi_query("master_key");',
        '$row = coapi_fetch($query_result);',
        '$master_key = $row["master_key"];',
        `$plain = f5_decrypt_string("${secret}", $master_key);`,
        'echo $plain;'
    ].join('');

    const cmd = `/usr/bin/php -r '${php}'`;
    return execBash(cmd)
        .then((result) => {
            i += 1;
            dataAra.push(result);
            if (i < encryptedDataAra.length) {
                return decryptHelper(encryptedDataAra, dataAra, i);
            }
            return dataAra.join('');
        })
        .catch((error) => {
            if (error.message.includes('Command failed')) {
                error.message = 'Command failed';
            }
            const message = `Error decrypting data: ${error}`;
            throw new Error(message);
        });
}

module.exports = SecureVault;
