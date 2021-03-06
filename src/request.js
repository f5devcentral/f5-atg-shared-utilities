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

const https = require('https');
const http = require('http');
const urlParse = require('url').parse;

/* eslint-disable no-console */
const DEBUG = false;

class Request {
    /**
     * This function sends an HTTP request to an endpoint denoted in the supplied options object.
     *
     * @private
     * @param {object} options - A JSON object with the following params
     * @param {object} options.headers - Holds various header options (e.g. 'Content-Length')
     * @param {string} options.protocol - 'http:' or 'https:'
     * @param {number} options.port
     * @param {string} options.auth - 'user:'
     * @param {object} body
     * @returns {object}
     */
    static send(options, body) {
        const reqOpts = JSON.parse(JSON.stringify(options));
        let protocol = https;
        let jsonBody;

        if (!reqOpts.headers) {
            reqOpts.headers = {};
        }

        if (reqOpts.protocol === 'http:') {
            protocol = http;
            if (reqOpts.port === 8100 && !reqOpts.auth) {
                reqOpts.auth = 'admin:';
            }
        }

        if ((typeof body !== 'undefined')
            && (['GET', 'HEAD'].indexOf(reqOpts.method) < 0)) {
            jsonBody = JSON.stringify(body);
            const sendSize = Buffer.byteLength(jsonBody);
            reqOpts.headers['Content-Length'] = sendSize.toString();
        }

        if (DEBUG) {
            console.log(`\nRequest to https://${reqOpts.host}/${reqOpts.path}:`);
            Object.keys(reqOpts.headers).forEach((key) => {
                console.log(`${key}: ${reqOpts.headers[key]}`);
            });
            console.log(body);
        }
        return new Promise((resolve, reject) => {
            const request = protocol.request(reqOpts, (response) => {
                let buffer = '';
                response.on('data', (chunk) => {
                    buffer += chunk;
                });
                response.on('end', () => {
                    if (DEBUG) {
                        console.log(`\nResponse from https://${reqOpts.host}/${reqOpts.path}:`);
                    }
                    if (buffer.length === 0) {
                        resolve('');
                        return;
                    }
                    if (response.statusCode === 204) {
                        if (DEBUG) {
                            console.log(response.statusCode);
                        }
                        resolve('');
                        return;
                    }

                    if (response.statusCode >= 400) {
                        reject(new Error(`${response.statusCode} ${buffer}`));
                    }
                    try {
                        if (DEBUG) {
                            console.log(response.statusCode, JSON.parse(buffer));
                        }
                        resolve(JSON.parse(buffer));
                    } catch (error) {
                        reject(new Error(`body is not JSON: ${buffer}`));
                    }
                });
            });

            request.on('error', (e) => {
                reject(e);
            });

            if (jsonBody) {
                try {
                    request.write(jsonBody);
                } catch (err) {
                    reject(err);
                }
            }

            request.end();
        });
    }

    static prepareUrl(url) {
        let parsed = urlParse(url);
        if (!parsed.protocol) {
            parsed = urlParse(`https://${url}`);
        }
        return parsed;
    }
}

module.exports = Request;
