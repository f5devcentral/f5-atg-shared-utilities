/*
 * Copyright 2021. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

/* eslint-disable global-require */

// elastic only works on node 8 and higher
if (process.version.split('.')[0].substring(1) >= 8) {
    const EventEmitter = require('events');
    const assert = require('assert');
    const sinon = require('sinon');
    const ElasticSearchReporter = require('../../../../src/mochaReporters/elasticSearchReporter/elasticSearchReporter');

    describe('elasticSearchReporter', () => {
        let runner;
        let client;
        let reporter;
        let test;
        let actualBody;

        class Client {
            index(item) {
                actualBody = JSON.parse(JSON.stringify(item.body));
            }
        }

        function assertResult(expectedBody) {
            delete actualBody.date;
            assert.deepStrictEqual(actualBody, expectedBody);
        }

        process.env.ESR_ELASTIC_SEARCH_HOST = 'my.elasticsearch.com';
        process.env.ESR_PRODUCT = 'AS3';
        process.env.ESR_PRODUCT_VERSION = '1.2.3';
        process.env.ESR_TEST_TYPE = 'myTestType';
        process.env.ESR_BIG_IP_VERSION = '7.8.9';
        process.env.ESR_TEST_RUN_ID = '123456';
        process.env.ESR_TEST_RUN_WEB_URL = 'https://my.gitlab.com/this/is/run/1';

        beforeEach(() => {
            runner = new EventEmitter();
            client = new Client();
            reporter = new ElasticSearchReporter(runner);
            reporter.client = client;

            test = {
                slow() {},
                title: 'this is the test title',
                parent: {
                    title: 'this is the suite title'
                }
            };
        });

        afterEach(() => {
            sinon.restore();
        });

        describe('result field', () => {
            const expectedBody = {
                id: '123456',
                bigIpVersion: '7.8.9',
                jobWebUrl: 'https://my.gitlab.com/this/is/run/1',
                product: 'AS3',
                productVersion: '1.2.3',
                suite: 'this is the suite title',
                title: 'this is the test title',
                type: 'myTestType'
            };

            it('should send pass report on passed test', () => {
                runner.emit('pass', test);
                expectedBody.result = 'passed';
                assertResult(expectedBody);
            });

            it('should send pass report on failed test', () => {
                runner.emit('fail', test);
                expectedBody.result = 'failed';
                assertResult(expectedBody);
            });

            it('should send pass report on skipped test', () => {
                runner.emit('pending', test);
                expectedBody.result = 'skipped';
                assertResult(expectedBody);
            });
        });
    });
}
