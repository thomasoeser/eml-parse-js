"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GB2312UTF8 = exports.isStringOrError = exports.mimeDecode = exports.wrap = exports.guid = exports.getCharsetName = exports.getBoundary = void 0;
var charset_1 = require("./charset");
/**
 * Gets the boundary name
 * @param contentType - string
 */
function getBoundary(contentType) {
    var match = /boundary='?(.+?)'?(\s*;[\s\S]*)?$/g.exec(contentType);
    return match ? match[1] : undefined;
}
exports.getBoundary = getBoundary;
//Gets the character encoding name for iconv, e.g. 'iso-8859-2' -> 'iso88592'
function getCharsetName(charset) {
    return charset.toLowerCase().replace(/[^0-9a-z]/g, '');
}
exports.getCharsetName = getCharsetName;
//Generates a random id
function guid() {
    return 'xxxxxxxxxxxx-4xxx-yxxx-xxxxxxxxxxxx'
        .replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0, v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    })
        .replace('-', '');
}
exports.guid = guid;
//Word-wrap the string 's' to 'i' chars per row
function wrap(s, i) {
    var a = [];
    do {
        a.push(s.substring(0, i));
    } while ((s = s.substring(i, s.length)) != '');
    return a.join('\r\n');
}
exports.wrap = wrap;
/**
 * Decodes mime encoded string to an unicode string
 *
 * @param {String} str Mime encoded string
 * @param {String} [fromCharset='UTF-8'] Source encoding
 * @return {String} Decoded unicode string
 */
function mimeDecode(str, fromCharset) {
    if (str === void 0) { str = ''; }
    if (fromCharset === void 0) { fromCharset = 'UTF-8'; }
    var encodedBytesCount = (str.match(/=[\da-fA-F]{2}/g) || []).length;
    var buffer = new Uint8Array(str.length - encodedBytesCount * 2);
    for (var i = 0, len = str.length, bufferPos = 0; i < len; i++) {
        var hex = str.substr(i + 1, 2);
        var chr = str.charAt(i);
        if (chr === '=' && hex && /[\da-fA-F]{2}/.test(hex)) {
            buffer[bufferPos++] = parseInt(hex, 16);
            i += 2;
        }
        else {
            buffer[bufferPos++] = chr.charCodeAt(0);
        }
    }
    return charset_1.decode(buffer, fromCharset);
}
exports.mimeDecode = mimeDecode;
/**
 * adjust string Or Error
 * @param param
 */
function isStringOrError(param) {
    return typeof param === 'string' || param instanceof Error;
}
exports.isStringOrError = isStringOrError;
/**
 * converting strings from gbk to utf-8
 */
exports.GB2312UTF8 = {
    Dig2Dec: function (s) {
        var retV = 0;
        if (s.length == 4) {
            for (var i = 0; i < 4; i++) {
                retV += eval(s.charAt(i)) * Math.pow(2, 3 - i);
            }
            return retV;
        }
        return -1;
    },
    Hex2Utf8: function (s) {
        var retS = '';
        var tempS = '';
        var ss = '';
        if (s.length == 16) {
            tempS = '1110' + s.substring(0, 4);
            tempS += '10' + s.substring(4, 10);
            tempS += '10' + s.substring(10, 16);
            var sss = '0123456789ABCDEF';
            for (var i = 0; i < 3; i++) {
                retS += '%';
                ss = tempS.substring(i * 8, (eval(i.toString()) + 1) * 8);
                retS += sss.charAt(this.Dig2Dec(ss.substring(0, 4)));
                retS += sss.charAt(this.Dig2Dec(ss.substring(4, 8)));
            }
            return retS;
        }
        return '';
    },
    Dec2Dig: function (n1) {
        var s = '';
        var n2 = 0;
        for (var i = 0; i < 4; i++) {
            n2 = Math.pow(2, 3 - i);
            if (n1 >= n2) {
                s += '1';
                n1 = n1 - n2;
            }
            else {
                s += '0';
            }
        }
        return s;
    },
    Str2Hex: function (s) {
        var c = '';
        var n;
        var ss = '0123456789ABCDEF';
        var digS = '';
        for (var i = 0; i < s.length; i++) {
            c = s.charAt(i);
            n = ss.indexOf(c);
            digS += this.Dec2Dig(eval(n.toString()));
        }
        return digS;
    },
    GB2312ToUTF8: function (s1) {
        var s = escape(s1);
        var sa = s.split('%');
        var retV = '';
        if (sa[0] != '') {
            retV = sa[0];
        }
        for (var i = 1; i < sa.length; i++) {
            if (sa[i].substring(0, 1) == 'u') {
                retV += this.Hex2Utf8(this.Str2Hex(sa[i].substring(1, 5)));
                if (sa[i].length) {
                    retV += sa[i].substring(5);
                }
            }
            else {
                retV += unescape('%' + sa[i]);
                if (sa[i].length) {
                    retV += sa[i].substring(5);
                }
            }
        }
        return retV;
    },
    UTF8ToGB2312: function (str1) {
        var substr = '';
        var a = '';
        var b = '';
        var c = '';
        var i = -1;
        i = str1.indexOf('%');
        if (i == -1) {
            return str1;
        }
        while (i != -1) {
            if (i < 3) {
                substr = substr + str1.substr(0, i - 1);
                str1 = str1.substr(i + 1, str1.length - i);
                a = str1.substr(0, 2);
                str1 = str1.substr(2, str1.length - 2);
                if ((parseInt('0x' + a) & 0x80) === 0) {
                    substr = substr + String.fromCharCode(parseInt('0x' + a));
                }
                else if ((parseInt('0x' + a) & 0xe0) === 0xc0) {
                    //two byte
                    b = str1.substr(1, 2);
                    str1 = str1.substr(3, str1.length - 3);
                    var widechar = (parseInt('0x' + a) & 0x1f) << 6;
                    widechar = widechar | (parseInt('0x' + b) & 0x3f);
                    substr = substr + String.fromCharCode(widechar);
                }
                else {
                    b = str1.substr(1, 2);
                    str1 = str1.substr(3, str1.length - 3);
                    c = str1.substr(1, 2);
                    str1 = str1.substr(3, str1.length - 3);
                    var widechar = (parseInt('0x' + a) & 0x0f) << 12;
                    widechar = widechar | ((parseInt('0x' + b) & 0x3f) << 6);
                    widechar = widechar | (parseInt('0x' + c) & 0x3f);
                    substr = substr + String.fromCharCode(widechar);
                }
            }
            else {
                substr = substr + str1.substring(0, i);
                str1 = str1.substring(i);
            }
            i = str1.indexOf('%');
        }
        return substr + str1;
    },
};
