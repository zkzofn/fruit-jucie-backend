"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var qeuryConductor = exports.qeuryConductor = function qeuryConductor(connection, query) {
  return new Promise(function (resolve, reject) {
    connection.query(query, function (error, results) {
      if (error) reject(error);

      resolve(results);
    });
  });
};

//# sourceMappingURL=queryConductor-compiled.js.map