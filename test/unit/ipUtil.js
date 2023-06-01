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
const ipUtil = require('../../src/ipUtils');

describe('IpUtil', () => {
    describe('.minimizeIP', () => {
        it('should return an undefined when nothing is sent in', () => {
            assert.strictEqual(ipUtil.minimizeIP(), undefined);
        });

        it('should return an empty string when an empty is sent in', () => {
            assert.strictEqual(ipUtil.minimizeIP(''), '');
        });

        it('should return wildcard addresses', () => {
            assert.strictEqual(ipUtil.minimizeIP('any'), 'any');
            assert.strictEqual(ipUtil.minimizeIP('any6'), 'any6');
            assert.strictEqual(ipUtil.minimizeIP('any%2222'), 'any%2222');
            assert.strictEqual(ipUtil.minimizeIP('any6%2222'), 'any6%2222');
            assert.strictEqual(ipUtil.minimizeIP('::%2222'), '::%2222');
        });

        it('should return valid IPv4 addresses', () => {
            assert.strictEqual(ipUtil.minimizeIP('0.0.0.0/24'), '0.0.0.0/24');
        });

        it('should return valid shortened IPv6 addresses', () => {
            assert.strictEqual(ipUtil.minimizeIP('0:0:0:0:0:0:0:0'), '::');
            assert.strictEqual(ipUtil.minimizeIP('1:0:0:0:0:0:0:0'), '1::');
            assert.strictEqual(ipUtil.minimizeIP('0:0:0:0:0:0:0:1'), '::1');
            assert.strictEqual(ipUtil.minimizeIP('1:0:0:0:0:0:0:1'), '1::1');
            assert.strictEqual(ipUtil.minimizeIP('1:0:1:0:0:0:0:0'), '1:0:1::');
            assert.strictEqual(ipUtil.minimizeIP('1:0:0:1:0:0:0:1'), '1:0:0:1::1');
        });

        it('should return valid IPv6 address from IPv4-Mapped address', () => {
            assert.strictEqual(ipUtil.minimizeIP('::ffff:192.0.3.47'), '::ffff:c000:32f'); // gitleaks:allow
        });

        it('should return valid IPv6 address from IPv4-Mapped address', () => {
            assert.strictEqual(ipUtil.minimizeIP('::ffff:10.0.0.1'), '::ffff:a00:1');
        });

        it('should return valid IPv4 address from an octal IP', () => {
            assert.strictEqual(ipUtil.minimizeIP('0127.0.0.1'), '87.0.0.1'); // gitleaks:allow
            assert.strictEqual(ipUtil.minimizeIP('0177.0.0.01'), '127.0.0.1'); // gitleaks:allow
            assert.strictEqual(ipUtil.minimizeIP('010.010.255.255'), '8.8.255.255'); // gitleaks:allow
        });
    });

    describe('.isIPv4', () => {
        function assertCheck(string, result) {
            assert.strictEqual(ipUtil.isIPv4(string), result, string);
        }
        it('should fail on empty input', () => {
            assertCheck('', false);
            assertCheck(undefined, false);
            assertCheck(null, false);
        });

        it('should fail on non-string input', () => {
            assertCheck({ spam: 'eggs' }, false);
            assertCheck(42, false);
            assertCheck(true, false);
        });

        it('should fail on invalid addresses', () => {
            assertCheck('127.0.0.1:8080', false);
            assertCheck('127.0.0', false);
        });

        it('should fail on IPv6 addresses', () => {
            assertCheck('2001:0db8:85a3:0000:0000:8a2e:0370:7334', false);
        });

        it('should pass on IPv4 addresses', () => {
            assertCheck('127.0.0.1', true);
            assertCheck('192.168.0.1', true);
        });

        it('should pass with route domain', () => {
            assertCheck('127.0.0.1%2', true);
        });

        it('should pass with masklen', () => {
            assertCheck('192.168.0.1/32', true);
            assertCheck('192.168.0.1/8', true);
            assertCheck('192.168.0.1/0', true);
            assertCheck('10.10.0.0/16', true);
        });

        it('should pass with masklen and route domain', () => {
            assertCheck('192.168.0.1%2/32', true);
            assertCheck('192.168.0.1%1/0', true);
        });
    });

    describe('.isIPv6', () => {
        function assertCheck(string, result) {
            assert.strictEqual(ipUtil.isIPv6(string), result, string);
        }
        it('should fail on empty input', () => {
            assertCheck('', false);
            assertCheck(undefined, false);
            assertCheck(null, false);
        });

        it('should fail on non-string input', () => {
            assertCheck({ spam: 'eggs' }, false);
            assertCheck(42, false);
            assertCheck(true, false);
        });

        it('should fail on invalid addresses', () => {
            assertCheck('2001:0db8:85a3:0000:0000:8a2e:0370:7334.8080', false);
            assertCheck('2001:0db8', false);
            assertCheck('2001:d0g8:85a3::8a2e:0370:7334', false);
        });

        it('should fail on IPv4 addresses', () => {
            assertCheck('192.168.0.1', false);
        });

        it('should pass on IPv6 addresses', () => {
            assertCheck('2001:0db8:85a3:0000:0000:8a2e:0370:7334', true);
            assertCheck('2001:0db8:85a3::8a2e:0370:7334', true);
            assertCheck('::1', true);
        });

        it('should pass on IPv4-mapped IPv6 addresses', () => {
            assertCheck('::FFFF:129.144.52.38', true); // gitleaks:allow
        });

        it('should pass with route domain', () => {
            assertCheck('2001:0db8:85a3:0000:0000:8a2e:0370:7334%2', true);
        });

        it('should pass with masklen', () => {
            assertCheck('2001:0db8:85a3:0000:0000:8a2e:0370:7334/128', true);
            assertCheck('2001:0db8:85a3:0000:0000:8a2e:0370:7334/112', true);
            assertCheck('2001:0db8:85a3:0000:0000:8a2e:0370:7334/104', true);
            assertCheck('2001:0db8:85a3:0000:0000:8a2e:0370:7334/96', true);
            assertCheck('2001:0db8:85a3:0000:0000:8a2e:0370:7334/80', true);
            assertCheck('2001:0db8:85a3:0000:0000:8a2e:0370:7334/72', true);
            assertCheck('2001:0db8:85a3:0000:0000:8a2e:0370:7334/64', true);
            assertCheck('2001:0db8:85a3:0000:0000:8a2e:0370:7334/56', true);
            assertCheck('2001:0db8:85a3:0000:0000:8a2e:0370:7334/40', true);
            assertCheck('2001:0db8:85a3:0000:0000:8a2e:0370:7334/32', true);
            assertCheck('2001:0db8:85a3:0000:0000:8a2e:0370:7334/24', true);
            assertCheck('2001:0db8:85a3:0000:0000:8a2e:0370:7334/16', true);
            assertCheck('2001:0db8:85a3:0000:0000:8a2e:0370:7334/0', true);
        });

        it('should pass with masklen and route domain', () => {
            assertCheck('2001:0db8:85a3:0000:0000:8a2e:0370:7334%2/128', true);
            assertCheck('2001:0db8:85a3:0000:0000:8a2e:0370:7334%1/0', true);
        });
    });

    describe('.isIPinRange', () => {
        // ['test name', ['test ip', 'low end', 'high end'], 'expected output']
        const validTestCases = [
            ['IPv4 too low', ['192.168.0.1', '192.168.0.2', '192.168.0.3'], false],
            ['IPv4 too high', ['192.168.0.3', '192.168.0.1', '192.168.0.2'], false],
            ['IPv4 too just right', ['192.168.0.2', '192.168.0.1', '192.168.0.3'], true],
            ['IPv4 match low end', ['192.168.0.1', '192.168.0.1', '192.168.0.3'], true],
            ['IPv4 match high end', ['192.168.0.3', '192.168.0.1', '192.168.0.3'], true],
            ['IPv4 different blocks', ['192.168.5.1', '192.168.0.1', '192.168.10.1'], true],
            ['IPv6 too low 1', ['2001:db7:dc75:365:220a:7c84:d796:6401', '2001:db7:dc75:365:220a:7c84:d796:6402', '2001:db7:dc75:365:220a:7c84:d796:6403'], false],
            ['IPv6 too low 2', ['2001:db6:dc75:365:220a:7c84:d796:6401', '2001:db7:dc75:365:220a:7c84:d796:6401', '2001:db7:dc75:365:220a:7c84:d796:6401'], false],
            ['IPv6 too high 1', ['2001:db7:dc75:365:220a:7c84:d796:6403', '2001:db7:dc75:365:220a:7c84:d796:6401', '2001:db7:dc75:365:220a:7c84:d796:6402'], false],
            ['IPv6 too high 2', ['2001:db7:dc76:365:220a:7c84:d796:6401', '2001:db7:dc74:365:220a:7c84:d796:6401', '2001:db7:dc75:365:220a:7c84:d796:6401'], false],
            ['IPv6 just right', ['2001:db7:dc75:365:220a:7c84:d796:6401', '2001:db7:dc74:365:220a:7c84:d796:6401', '2001:db8:dc75:365:220a:7c84:d796:6401'], true]
        ];

        validTestCases.forEach((testCase) => {
            it(testCase[0], () => {
                assert.deepStrictEqual(ipUtil.isIPinRange(testCase[1][0], testCase[1][1], testCase[1][2]), testCase[2], `${testCase[1]} failed`);
            });
        });

        const errorTestCases = [
            ['Bad low end', ['foo', '192.168.0.2', '192.168.0.3'], /ip to test is not a valid IP/],
            ['Bad IP', ['192.168.0.2', 'foo', '192.168.0.3'], /lowEnd is not a valid IP/],
            ['Bad high end', ['192.168.0.2', '192.168.0.3', 'foo'], /highEnd is not a valid IP/],
            ['Different types', ['192.168.0.2', '192.168.0.3', '2001:db7:dc75:365:220a:7c84:d796:6401'], /All IPs must be of same type/]
        ];

        errorTestCases.forEach((testCase) => {
            it(testCase[0], () => {
                assert.throws(() => ipUtil.isIPinRange(testCase[1][0], testCase[1][1], testCase[1][2]), testCase[2]);
            });
        });
    });

    describe('.ipToNumberString', () => {
        // ['test name', 'input', 'expected output']
        const testCases = [
            ['IPv4 localhost', '127.0.0.1', '2130706433'],
            ['IPv4', '192.168.0.1', '3232235521'],
            ['IPv4 any', '0.0.0.0', '0'],
            ['IPv6 localhost', '::1', '1'],
            ['IPv6', '2001:db7:dc75:365:220a:7c84:d796:6401', '42540766400282592856903984001653826561'],
            ['IPv6 missing blocks', '2001:0db8:85a3:0000::8a2e:0370:7334', '42540766452641154071740215577757643572'],
            ['IPv6 any', '::', '0']
        ];

        testCases.forEach((testCase) => {
            it(testCase[0], () => {
                assert.deepStrictEqual(ipUtil.ipToNumberString(testCase[1]), testCase[2], `${testCase[1]} failed`);
            });
        });
    });

    describe('.splitAddress', () => {
        // ['test name', 'input', 'expected output']
        const testCases = [
            ['IPv4', '127.0.0.1:80', ['127.0.0.1', '80']],
            ['IPv6 ::', '::1.80', ['::1', '80']],
            ['IPv6', '2001:0db8:85a3:0000::8a2e:0370:7334.80', ['2001:0db8:85a3:0000::8a2e:0370:7334', '80']],
            ['any', 'any:80', ['any', '80']],
            ['any6', 'any6.80', ['any6', '80']],
            ['0.0.0.0', '0.0.0.0:80', ['0.0.0.0', '80']],
            ['::', '::.80', ['::', '80']],
            ['no port IPv4', '127.0.0.1', ['127.0.0.1', undefined]],
            ['no port simple IPv6', '::1', ['::1', undefined]],
            ['no port IPv6', '2001:0db8:85a3:0000:8a2e:0370:7334', ['2001:0db8:85a3:0000:8a2e:0370:7334', undefined]],
            ['no port any', 'any', ['any', undefined]],
            ['no port any6', 'any6', ['any6', undefined]],
            ['no port 0.0.0.0', '0.0.0.0', ['0.0.0.0', undefined]],
            ['no port ::', '::', ['::', undefined]],
            ['route domain', '127.0.0.1%123:80', ['127.0.0.1%123', '80']],
            ['route domain IPv6', '::1%123.80', ['::1%123', '80']],
            ['route domain no port', '127.0.0.1%123', ['127.0.0.1%123', undefined]],
            ['route domain IPv6 no port', '::1%123', ['::1%123', undefined]],
            ['route domain any no port', 'any%123', ['any%123', undefined]],
            ['route domain any6 no port', 'any6%123', ['any6%123', undefined]]
        ];

        testCases.forEach((testCase) => {
            it(testCase[0], () => {
                assert.deepStrictEqual(ipUtil.splitAddress(testCase[1]), testCase[2], `${testCase[1]} failed`);
            });
        });
    });

    describe('.getCidrFromNetmask', () => {
        const testCases = [
            {
                mask: 'any',
                cidr: '/0'
            },
            {
                mask: '254.0.0.0', // gitleaks:allow
                cidr: '/7'
            },
            {
                mask: '255.224.0.0', // gitleaks:allow
                cidr: '/11'
            },
            {
                mask: '255.255.255.0', // gitleaks:allow
                cidr: '/24'
            },
            {
                mask: '255.255.255.248', // gitleaks:allow
                cidr: '/29'
            },
            {
                mask: '255.255.255.255',
                cidr: '/32'
            },
            {
                mask: '8000::',
                cidr: '/1'
            },
            {
                mask: 'c000::',
                cidr: '/2'
            },
            {
                mask: 'ff00::',
                cidr: '/8'
            },
            {
                mask: 'fff0::',
                cidr: '/12'
            },
            {
                mask: 'fff8:0000::',
                cidr: '/13'
            },
            {
                mask: 'ffff:0000::',
                cidr: '/16'
            },
            {
                mask: 'ffff:d000::',
                cidr: '/19'
            },
            {
                mask: 'ffff:ffff:ffff:ffff::',
                cidr: '/64'
            },
            {
                mask: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:fff8',
                cidr: '/125'
            },
            {
                mask: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:fffc',
                cidr: '/126'
            },
            {
                mask: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:fffe',
                cidr: '/127'
            },
            {
                mask: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
                cidr: '/128'
            }
        ];

        testCases.forEach((testCase) => {
            it(`should return correct cidr '${testCase.cidr}' when mask is ${testCase.mask}`, () => {
                assert.deepStrictEqual(ipUtil.getCidrFromNetmask(testCase.mask), testCase.cidr);
            });
        });
    });

    describe('.parseIpAddress', () => {
        const testCases = [
            {
                expected: {
                    ip: '',
                    routeDomain: '',
                    cidr: '',
                    netmask: '255.255.255.255',
                    ipWithRoute: ''
                }
            },
            {
                address: '',
                expected: {
                    ip: '',
                    routeDomain: '',
                    cidr: '',
                    netmask: '255.255.255.255',
                    ipWithRoute: ''
                }
            },
            {
                address: '0.0.0.0',
                expected: {
                    ip: '0.0.0.0',
                    routeDomain: '',
                    cidr: '0',
                    netmask: 'any',
                    ipWithRoute: '0.0.0.0'
                }
            },
            {
                address: 'any',
                expected: {
                    ip: '0.0.0.0',
                    routeDomain: '',
                    cidr: '0',
                    netmask: 'any',
                    ipWithRoute: '0.0.0.0'
                }
            },
            {
                address: 'any6',
                expected: {
                    ip: '::',
                    routeDomain: '',
                    cidr: '0',
                    netmask: 'any6',
                    ipWithRoute: '::'
                }
            },
            {
                address: '192.0.2.123%123',
                expected: {
                    ip: '192.0.2.123',
                    routeDomain: '%123',
                    cidr: '',
                    netmask: '255.255.255.255',
                    ipWithRoute: '192.0.2.123%123'
                }
            },
            {
                address: '192.0.2.123%2222/24',
                expected: {
                    ip: '192.0.2.123',
                    routeDomain: '%2222',
                    cidr: '24',
                    netmask: '255.255.255.0',
                    ipWithRoute: '192.0.2.123%2222'
                }
            },
            {
                address: '192.0.2.1%0',
                expected: {
                    ip: '192.0.2.1',
                    routeDomain: '',
                    cidr: '',
                    netmask: '255.255.255.255',
                    ipWithRoute: '192.0.2.1'
                }
            },
            {
                address: '::',
                expected: {
                    ip: '::',
                    routeDomain: '',
                    cidr: '0',
                    netmask: 'any6',
                    ipWithRoute: '::'
                }
            },
            {
                address: '1:1:1:1:1:1',
                expected: {
                    ip: '1:1:1:1:1:1::',
                    routeDomain: '',
                    cidr: '',
                    netmask: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
                    ipWithRoute: '1:1:1:1:1:1::'
                }
            },
            {
                address: '2001:0db8:85a3:0000:0000:8a2e:0370:7335/64',
                expected: {
                    ip: '2001:db8:85a3::8a2e:370:7335',
                    routeDomain: '',
                    cidr: '64',
                    netmask: 'ffff:ffff:ffff:ffff::',
                    ipWithRoute: '2001:db8:85a3::8a2e:370:7335'
                }
            },
            {
                address: '2001:0db8:85a3:0000:0000:8a2e:0370:7335%55/64',
                expected: {
                    ip: '2001:db8:85a3::8a2e:370:7335',
                    routeDomain: '%55',
                    cidr: '64',
                    netmask: 'ffff:ffff:ffff:ffff::',
                    ipWithRoute: '2001:db8:85a3::8a2e:370:7335%55'
                }
            }
        ];

        testCases.forEach((testCase) => {
            it(`should return an object with following address ${testCase.address} or an empty object`, () => {
                assert.deepStrictEqual(ipUtil.parseIpAddress(testCase.address), testCase.expected);
            });
        });
    });

    describe('.calcNetmask', () => {
        const testCases = [
            {
                expected: '255.255.255.255'
            },
            {
                cidr: '',
                ip: '192.0.2.1',
                expected: '255.255.255.255'
            },
            {
                cidr: '24',
                ip: '192.0.2.1',
                expected: '255.255.255.0'
            },
            {
                cidr: '13',
                ip: '192.0.2.1',
                expected: '255.248.0.0'
            },
            {
                cidr: '0',
                ip: '::',
                expected: 'any6'
            },
            {
                cidr: '0',
                ip: '192.0.2.0',
                expected: 'any'
            },
            {
                cidr: '32',
                ip: '192.0.2.1',
                expected: '255.255.255.255'
            },
            {
                cidr: '',
                ip: '::1',
                expected: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff'
            },
            {
                cidr: '24',
                ip: '::1',
                expected: 'ffff:ff00::'
            },
            {
                cidr: '64',
                ip: '::1',
                expected: 'ffff:ffff:ffff:ffff::'
            },
            {
                cidr: '120',
                ip: '::1',
                expected: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ff00'
            },
            {
                cidr: '128',
                ip: '::1',
                expected: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff'
            }
        ];

        testCases.forEach((testCase) => {
            it(`should calculate the /CIDR value (${testCase.cidr}) to netmask value (${testCase.expected})`, () => {
                // send in the expected because calcNetmask just needs to know IPv4 vs IPv6
                assert.deepStrictEqual(ipUtil.calcNetmask(testCase.cidr, testCase.ip), testCase.expected);
            });
        });
    });
});
