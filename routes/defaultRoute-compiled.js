'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _DBconfig = require('./DBconfig');

var _queryConductor = require('./queryConductor');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

router.get("/", function (req, res, next) {
  _DBconfig.pool.getConnection(function (err, connection) {
    if (err) throw err;

    var query = '';

    (0, _queryConductor.queryConductor)(connection, query).then(function (results) {
      res.json({ results: results });

      connection.release();
    });
  });
});

module.exports = router;

//# sourceMappingURL=defaultRoute-compiled.js.map