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

const { Client } = require('@elastic/elasticsearch');
const mocha = require('mocha');

const parentReporter = mocha.reporters.Spec;

/**
 * Passes mocha test results to ElasticSearch
 *
 * This class uses several environment variables.
 *         + ESR_ELASTIC_SEARCH_HOST: ip_address:port of elastic search host
 *         + ESR_PRODUCT: Product (DO, AS3, for example)
 *         + ESR_TEST_TYPE: Test type (integration, unit, for example)
 *         + ESR_TEST_RUN_ID: (optional) ID to find job in your test system
 *         + ESR_TEST_RUN_WEB_URL: (optional) Url to view job details through a browser
 *         + ESR_BIG_IP_VERSION: (optional) Version of BIG-IP we are testing if applicable
 *         + ESR_PRODUCT_VERSION: (optional) Version of product
 *
 * @param {EventListener} runner - Listener for Mocha events
 */
function ElasticSearchReporter(runner) {
    parentReporter.call(this, runner);

    this.client = new Client({ node: `http://${process.env.ESR_ELASTIC_SEARCH_HOST}` });

    runner.on('pass', (test) => {
        sendResult.call(this, test, 'passed');
    });

    runner.on('fail', (test) => {
        sendResult.call(this, test, 'failed');
    });

    runner.on('pending', (test) => {
        sendResult.call(this, test, 'skipped');
    });
}

function sendResult(test, result) {
    try {
        const data = {
            result,
            id: process.env.ESR_TEST_RUN_ID,
            product: process.env.ESR_PRODUCT,
            productVersion: process.env.ESR_PRODUCT_VERSION,
            type: process.env.ESR_TEST_TYPE,
            title: test.title,
            suite: test.parent.title,
            bigIpVersion: process.env.ESR_BIG_IP_VERSION,
            jobWebUrl: process.env.ESR_TEST_RUN_WEB_URL,
            date: new Date()
        };

        const index = `${process.env.ESR_PRODUCT}_${process.env.ESR_TEST_TYPE}`.toLowerCase();
        this.client.index(
            {
                index,
                body: data
            }
        );
    } catch (err) {
        throw (err);
    }
}

mocha.utils.inherits(ElasticSearchReporter, parentReporter);

module.exports = ElasticSearchReporter;
