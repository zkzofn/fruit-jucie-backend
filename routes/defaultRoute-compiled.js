'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _DBconfig = require('./DBconfig');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

router.get("/", function (req, res, next) {
  _DBconfig.pool.getConnection(function (err, connection) {
    var query = "";

    connection.query(query, function (error, results) {
      if (error) throw error;

      // do something process
      res.json({ results: results });

      connection.release();
    });
  });
});

module.exports = router;

//# sourceMappingURL=defaultRoute-compiled.js.map