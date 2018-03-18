"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAuthUser = exports.makeSessionKey = exports.secretToken = undefined;

var _cryptoJs = require("crypto-js");

var _cryptoJs2 = _interopRequireDefault(_cryptoJs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var secretToken = exports.secretToken = "fRu1t_token_privacy";

var makeSessionKey = exports.makeSessionKey = function makeSessionKey(user) {
  return _cryptoJs2.default.AES.encrypt(JSON.stringify(user), secretToken).toString();
};

var getAuthUser = exports.getAuthUser = function getAuthUser(sessionKey) {
  return JSON.parse(_cryptoJs2.default.AES.decrypt(sessionKey, secretToken).toString(_cryptoJs2.default.enc.Utf8));
};

//# sourceMappingURL=auth-compiled.js.map