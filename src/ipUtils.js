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

const bigInt = require('big-integer');

// test if string is an f5 IP, which means valid IPv4 or IPv6
// with optional %route-domain and/or /mask-length appended.
const IPv4rex = /^(((25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)[.]){3}(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d))(%(6553[0-5]|655[0-2]\d|65[0-4]\d{2}|6[0-4]\d{3}|[1-5]\d{4}|[1-9]\d{3}|[1-9]\d{2}|[1-9]?\d))?(\x2f(3[012]|2\d|1\d|\d))?$/;
const IPv6rex = /^(::(([0-9a-f]{1,4}:){0,5}((([0-9a-f]{1,4}:)?[0-9a-f]{1,4})|(((25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)[.]){3}(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d))))?)|([0-9a-f]{1,4}::(([0-9a-f]{1,4}:){0,4}((([0-9a-f]{1,4}:)?[0-9a-f]{1,4})|(((25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)[.]){3}(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d))))?)|([0-9a-f]{1,4}:[0-9a-f]{1,4}::(([0-9a-f]{1,4}:){0,3}((([0-9a-f]{1,4}:)?[0-9a-f]{1,4})|(((25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)[.]){3}(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d))))?)|([0-9a-f]{1,4}(:[0-9a-f]{1,4}){2}::(([0-9a-f]{1,4}:){0,2}((([0-9a-f]{1,4}:)?[0-9a-f]{1,4})|(((25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)[.]){3}(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d))))?)|([0-9a-f]{1,4}(:[0-9a-f]{1,4}){3}::(([0-9a-f]{1,4}:)?((([0-9a-f]{1,4}:)?[0-9a-f]{1,4})|(((25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)[.]){3}(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d))))?)|([0-9a-f]{1,4}(:[0-9a-f]{1,4}){4}::((([0-9a-f]{1,4}:)?[0-9a-f]{1,4})|(((25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)[.]){3}(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)))?)|([0-9a-f]{1,4}(:[0-9a-f]{1,4}){5}::([0-9a-f]{1,4})?)|([0-9a-f]{1,4}(:[0-9a-f]{1,4}){0,6}::)|(([0-9a-f]{1,4}:){7}[0-9a-f]{1,4})(%(6553[0-5]|655[0-2]\d|65[0-4]\d{2}|6[0-4]\d{3}|[1-5]\d{4}|[1-9]\d{3}|[1-9]\d{2}|[1-9]?\d))?(\x2f(12[0-8]|1[01]\d|[1-9]?\d))?$/;

class IpUtil {
    /**
     * minimize zeroes in the string representation
     * of an F5 IPv4/6 address.  TMSH does this, but
     * TMGUI sometimes doesn't.  Input should be f5ip
     * or empty/undefined, otherwise returns garbage
     * (usually NaN)
     *
     * @public
     * @param {string} ip - IPv4/6 address as string
     * @returns {string}
     */
    static minimizeIP(ip) {
        let cidr;
        let rd;
        let left;
        let middle;
        let right;

        if ((ip === undefined) || (ip === '::') || (ip === '')
            || (ip.includes('any')) || (ip.includes('any6'))) {
            return ip;
        }

        cidr = ip.split('/'); ip = cidr[0]; cidr = cidr[1];
        rd = ip.split('%'); ip = rd[0]; rd = rd[1];

        if (!ip.includes(':')) {
            ip = ip.split('.');
            ip.forEach((v, x, a) => {
                // check for octal ip
                if (v[0] === '0') {
                    a[x] = parseInt(v, 8).toString(10);
                } else {
                    a[x] = parseInt(v, 10).toString(10);
                }
            });
            ip = ip.join('.');
        } else {
            ip = ip.split('.');
            if (ip.length > 1) {
                const b = ip.slice(1);
                ip = ip[0].split(':');
                b.unshift(ip.slice(-1));
                ip = ip.slice(0, -1);
                // eslint-disable-next-line no-bitwise
                ip.push(((parseInt(b[0], 10) << 8) + parseInt(b[1], 10)).toString(16));
                // eslint-disable-next-line no-bitwise
                ip.push(((parseInt(b[2], 10) << 8) + parseInt(b[3], 10)).toString(16));
            }
            ip = ip.join(':');

            ip = ip.split('::');
            left = ip[0].split(':');
            right = (ip.length > 1) ? ip[1].split(':') : [];
            middle = Array(8 - (left.length + right.length)).fill('0');
            ip = left.concat(middle, right);
            ip.forEach((v, x, a) => {
                a[x] = ((v === undefined) || (v === '')) ? 0 : parseInt(v, 16);
            });
            let p;
            let q;
            let i;
            let j;
            let k;
            let n;
            // We scan the array ip finding consecutive zero elements and
            // also converting numeric values to hexadecimal strings
            // i and n are index and numeric value of element we are looking at
            // j and k are first index and count of currently-found series of zeros
            // p and q are first index and count of the longest series of zeros
            // found so far
            // We replace the longest series of zero elements with '' so when
            // we join ip's elements into one string we'll get '::' there, but
            // since join() only fills interstices we must handle '::' at
            // start or end of string specially
            for (i = 0, j = -1, p = -1, q = -1; i < ip.length; i += 1) {
                n = ip[i];
                if (n === 0) {
                    if (j < 0) { j = i; k = 1; } else { k += 1; }
                } else if (j >= 0) {
                    if (k > q) { p = j; q = k; }
                    j = -1;
                }
                ip[i] = n.toString(16);
            }
            if ((j >= 0) && (k > q)) { p = j; q = k; }
            if (q > 7) {
                ip = [':', ''];
            } else if (q > 1) {
                const g = ((p === 0) || ((p + q) > 7)) ? ':' : '';
                ip.splice(p, q, g);
            }
            ip = ip.join(':');
        }

        if ((rd !== undefined) && (rd !== '')) {
            ip += `%${parseInt(rd, 10).toString(10)}`;
        }
        if ((cidr !== undefined) && (cidr !== '')) {
            ip += `/${parseInt(cidr, 10).toString(10)}`;
        }

        return ip;
    }

    /**
     * Common functionality for IP address checking
     *
     * @private
     *
     * @param {string} address - IPv4/6 address as string
     * @param {RegExp} regex - RegExp to use for testing the string
     * @returns {boolean}
     */
    static isIPCommon(address, regex) {
        if (!address) return false;
        if (typeof address !== 'string') return false;

        const lowerAddress = address.toLowerCase();
        if (lowerAddress.match(/[^0-9a-f:.%\x2f]/) !== null) return false;

        return regex.test(lowerAddress);
    }

    /**
     * Checks if an address is IPv4
     *
     * @public
     * @param {string} address - address to check
     * @returns {boolean}
     */
    static isIPv4(address) {
        return this.isIPCommon(address, IPv4rex);
    }

    /**
     * Checks if an address is IPv6
     *
     * @public
     * @param {string} address - address to check
     * @returns {boolean}
     */
    static isIPv6(address) {
        return this.isIPCommon(address, IPv6rex);
    }

    /**
     * Splits an IPv4 or IPv6 address into an address and port pair
     *
     * @public
     * @param {string} combined - address:port pair
     * @returns {Array}
     */
    static splitAddress(combined) {
        let isAnyV4;
        let isAnyV6;
        if (combined.startsWith('any6')) {
            isAnyV6 = true;
            combined = combined.replace('any6', '::');
        } else if (combined.startsWith('any')) {
            isAnyV4 = true;
            combined = combined.replace('any', '0.0.0.0');
        }

        // If there is no port, we need something that we can find with the
        // regex below. At this point it doesn't matter that the separator matches
        // the IP type
        if (!(combined.indexOf('.') >= 0 && combined.indexOf(':') >= 0)) {
            combined += ':NO_PORT';
        }

        let port = combined.match(/[.:]?[0-9]+$/);
        let address;
        if (port) {
            port = port[0];
            address = combined.replace(port, '');
        } else {
            address = combined;
            address = address.replace(':NO_PORT', '');
        }

        if (isAnyV4) {
            address = address.replace('0.0.0.0', 'any');
        } else if (isAnyV6) {
            address = address.replace('::', 'any6');
        }

        return [address, port ? port.slice(1) : undefined];
    }

    /**
     * Returns the CIDR for the given netmask
     *
     * @public
     * @param {string} netmask - Network mask
     * @param {boolean} [noSlash] - Whether or not to prefix a '/' on the CIDR. Default false.
     * @returns {Array}
     */
    static getCidrFromNetmask(netmask, noSlash) {
        if (netmask === 'any' || netmask === 'any6') {
            return noSlash ? '0' : '/0';
        }
        let cidr = 0;

        if (netmask.includes(':')) {
            const converted = [];
            // convert Ipv6 hex to decimal
            netmask.split(':').forEach((chunk) => {
                const hexInt = parseInt(chunk, 16);
                converted.push(hexInt >> 8); // eslint-disable-line no-bitwise
                converted.push(hexInt & 0xff); // eslint-disable-line no-bitwise
            });

            netmask = converted.join('.');
        }
        const maskNodes = netmask.match(/(\d+)/g);
        maskNodes.forEach((m) => {
            // eslint-disable-next-line no-bitwise
            cidr += (((m >>> 0).toString(2)).match(/1/g) || []).length;
        });
        return noSlash ? cidr : `/${cidr}`;
    }

    /**
     * Calculates IPv4 netmask
     * @private
     *
     * @param {number} maskLength - length of mask
     * @returns {string}
     */
    static calcIPv4Netmask(maskLength) {
        if (typeof maskLength === 'undefined' || maskLength === '') {
            maskLength = 32;
        }
        maskLength = (maskLength > 32) ? 32 : maskLength;
        maskLength = (maskLength < 0) ? 0 : maskLength;
        const mask = [];
        for (let i = 0; i < 4; i += 1) {
            const n = Math.min(maskLength, 8);
            mask.push(256 - Math.pow(2, 8 - n)); // eslint-disable-line no-restricted-properties
            maskLength -= n;
        }
        return mask.join('.');
    }

    /**
     * Calculates IPv6 netmask
     * @private
     *
     * @param {number} maskLength - length of mask
     * @returns {string}
     */
    static calcIPv6Netmask(maskLength) {
        if (typeof maskLength === 'undefined' || maskLength === '') {
            maskLength = 128;
        }
        maskLength = (maskLength > 128) ? 128 : maskLength;
        maskLength = (maskLength < 0) ? 0 : maskLength;
        const mask = [];
        for (let i = 0; i < 8; i += 1) {
            const n = Math.min(maskLength, 16);
            const decimal = (65536 - Math.pow(2, 16 - n)); // eslint-disable-line no-restricted-properties
            mask.push(decimal.toString(16));
            maskLength -= n;
        }
        return this.minimizeIP(mask.join(':'));
    }

    /**
     * Calculates the netmask from a mask length and ip
     *
     * @param {number} maskLength - mask length to return
     * @param {string} ip - ip address
     * @returns {string}
     */
    static calcNetmask(maskLength, ip) {
        // check for wildcard
        if (maskLength === '0') {
            return (!ip.includes(':')) ? 'any' : 'any6';
        }

        if (typeof ip !== 'undefined' && ip.includes(':')) {
            return this.calcIPv6Netmask(maskLength);
        }
        return this.calcIPv4Netmask(maskLength);
    }

    /**
     * Parses an IP address into its components
     *
     * @param {string} address - Address to parse
     * @returns {object} - Object containing IP, route domain, CIRD, netmask, IP with route
     */
    static parseIpAddress(address) {
        if (address === 'any') {
            address = '0.0.0.0';
        }
        if (address === 'any6') {
            address = '::';
        }

        address = this.minimizeIP(address) || '';
        const parsedIp = address.match(/([a-zA-Z0-9.:]+)(%(\d+))?(\/(\d+))?/) || [];

        // IPv6 f5 wildcard should be '::' but the above match will give it ':'
        const ip = (parsedIp[1] === ':') ? '::' : parsedIp[1] || '';
        // if parsedIp[3] is '' we want routeDomain set to ''
        const routeDomain = (typeof parsedIp[3] === 'undefined' || parsedIp[3] === '0') ? '' : `%${parsedIp[3]}`;
        // for f5 wildcard cidr should be 0, otherwise take the indicated value
        const cidr = (ip === '0.0.0.0' || ip === '::') ? '0' : parsedIp[5] || '';
        const netmask = this.calcNetmask(cidr, ip);
        const ipWithRoute = `${ip}${routeDomain}`;

        return {
            ip,
            routeDomain,
            cidr,
            netmask,
            ipWithRoute
        };
    }

    /**
     * Takes a string representation of an IP v4 address and returns a string representation of this IP as a number
     *
     * @param {string} ip - An IP v4 address
     * @returns {string} A representation of the given IP as a single number
     */
    static ipV4ToNumberString(ip) {
        const parts = ip.split('.');

        let result = parts[0] * Math.pow(256, 3); // eslint-disable-line no-restricted-properties
        result += parts[1] * Math.pow(256, 2); // eslint-disable-line no-restricted-properties
        result += parts[2] * 256;
        result += parts[3] * 1;
        return result.toString();
    }

    /**
     * Takes a string representation of an IP v6 address and returns a string representation of this IP as a number
     *
     * @param {string} ip - An IP v6 address
     * @returns {string} A representation of the given IP as a single number
     */
    static ipV6ToNumberString(ip) {
        const parts = [];
        ip.split(':').forEach((block) => {
            let binary = block ? parseInt(block, 16).toString(2) : '0';
            while (binary.length < 16) {
                binary = `0${binary}`;
            }
            parts.push(binary);
        });
        const binary = parts.join('');

        return bigInt(binary, 2).toString();
    }

    /**
     * Takes a string representation of an IP address and returns a string representation of this IP as a number
     *
     * @param {string} ip - An IP address
     * @returns {string} A representation of the given IP as a single number
     */
    static ipToNumberString(ip) {
        if (this.isIPv4(ip)) {
            return this.ipV4ToNumberString(ip);
        }
        return this.ipV6ToNumberString(ip);
    }

    /**
     * Determines if an IP address is between two other IP addresses
     *
     * @param {string} ip - The IP to test
     * @param {string} lowEnd - The low end of the range of IP addresses to test
     * @param {string} highEnd - The high end of the range of IP addresses to test
     *
     * @returns {boolean} true if ip is between the lowEnd and highEnd (inclusive). Otherwise returns false.
     */
    static isIPinRange(ip, lowEnd, highEnd) {
        if (!this.isIPv4(ip) && !this.isIPv6(ip)) {
            throw new Error('ip to test is not a valid IP');
        }

        if (!this.isIPv4(lowEnd) && !this.isIPv6(lowEnd)) {
            throw new Error('lowEnd is not a valid IP');
        }

        if (!this.isIPv4(highEnd) && !this.isIPv6(highEnd)) {
            throw new Error('highEnd is not a valid IP');
        }

        if (this.isIPv4(ip) && !(this.isIPv4(lowEnd) && this.isIPv4(highEnd))) {
            throw new Error('All IPs must be of same type (IPv4 or IPv6');
        } else if (this.isIPv6(ip) && !(this.isIPv6(lowEnd) && this.isIPv6(highEnd))) {
            throw new Error('All IPs must be of same type (IPv4 or IPv6');
        }

        // Strip off CIDR and convert to a number
        const ipString = this.ipToNumberString(ip.split('/')[0]);
        const lowIpString = this.ipToNumberString(lowEnd);
        const highIpString = this.ipToNumberString(highEnd);

        return ipString >= lowIpString && ipString <= highIpString;
    }
}

module.exports = IpUtil;
