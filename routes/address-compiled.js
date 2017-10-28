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

    var query = 'SELECT * \n         FROM address\n        WHERE user_id = ' + req.query.userId;

    (0, _queryConductor.queryConductor)(connection, query).then(function (results) {
      res.json({ myAddressList: results });
      connection.release();
    });
  });
});

module.exports = router;

//# sourceMappingURL=address-compiled.js.map