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

const tmshUtil = require('./tmshUtils');

/* eslint-disable no-console */
const DEBUG = false;

class Request {
    /**
     * This function sends an HTTP request to an endpoint denoted in the supplied options object.
     *
     * @private
     * @param {object} requestOptions - A JSON object with the following params. These are passed on to node's
     *                                  http/https request method. See
     *                                  https://nodejs.org/api/https.html#httpsrequestoptions-callback for details.
     * @param {object} requestOptions.headers - Holds various header options (e.g. 'Content-Length')
     * @param {string} requestOptions.protocol - 'http:' or 'https:'
     * @param {number} requestOptions.port
     * @param {string} requestOptions.auth - 'user:'
     * @param {object} body
     * @param {object} [options] - Addtional options to modify how the function behaves
     * @param {boolean} [options.returnResponseObj] - If true, returns the response object instead of just the body
     * @param {boolean} [options.rejectErrStatusCodes=true] - If true, rejects the promise when a response with a
     *                                                        400+ status code is received. Defaults to true
     * @returns {Promise} Promise object that resolves with either the response body or the response object depending on
     *                    the options that are provided
     */
    static send(requestOptions, body, options) {
        const reqOpts = JSON.parse(JSON.stringify(requestOptions));
        const defaultOptions = {
            rejectErrStatusCodes: true
        };
        const opts = Object.assign(defaultOptions, options);
        let protocol = https;
        let jsonBody;

        if (!reqOpts.headers) {
            reqOpts.headers = {};
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

        let promise = Promise.resolve();
        if (reqOpts.protocol === 'http:') {
            protocol = http;
            if (reqOpts.port === 8100 && !reqOpts.auth) {
                promise = getPrimaryAdminUser()
                    .then((primaryAdminUser) => {
                        reqOpts.auth = `${primaryAdminUser}:`;
                    });
            }
        }

        return promise
            .then(() => new Promise((resolve, reject) => {
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
                            resolve(buildResponse('', response, opts));
                            return;
                        }
                        if (response.statusCode === 204) {
                            if (DEBUG) {
                                console.log(response.statusCode);
                            }
                            resolve(buildResponse('', response, opts));
                            return;
                        }

                        if (response.statusCode >= 400 && opts.rejectErrStatusCodes) {
                            if (DEBUG) {
                                console.error(response.statusCode, buffer);
                            }
                            reject(new Error(`${response.statusCode} ${buffer}`));
                            return;
                        }

                        const contentType = response.headers['content-type'] || '';
                        let data = buffer;

                        if (contentType.includes('application/json')) {
                            try {
                                data = JSON.parse(buffer);
                            } catch (error) {
                                if (DEBUG) {
                                    console.error(response.statusCode, buffer);
                                }
                                reject(new Error(`body is not JSON: ${buffer}`));
                                return;
                            }
                        }

                        if (DEBUG) {
                            console.log(response.statusCode, data);
                        }
                        resolve(buildResponse(data, response, opts));
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
            }));
    }

    static prepareUrl(url) {
        let parsed = urlParse(url);
        if (!parsed.protocol) {
            parsed = urlParse(`https://${url}`);
        }
        return parsed;
    }
}

function getPrimaryAdminUser() {
    return tmshUtil.executeTmshCommand('list sys db systemauth.primaryadminuser')
        .then((result) => {
            if (!result || !result.value) {
                return Promise.reject(new Error('Unable to get primary admin user'));
            }
            const adminUser = result.value.replace(/"/g, '');
            return Promise.resolve(adminUser);
        });
}

function buildResponse(body, response, options) {
    if (options.returnResponseObj) {
        return {
            body,
            statusCode: response.statusCode,
            headers: response.headers
        };
    }
    return body;
}

module.exports = Request;
