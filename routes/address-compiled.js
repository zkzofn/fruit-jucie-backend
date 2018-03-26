'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _DBconfig = require('./DBconfig');

var _queryConductor = require('./queryConductor');

var _auth = require('./auth');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

/**
 * @file /routes/address.js
 * @brief GET address API
 * @author 이장호
 * @date 2018-03-27
 *
 * @sequence
 * 1. 사용자가 등록한 주소 목록을 return
 *
 * @return addressList<Object>
 */
router.get("/", function (req, res, next) {
  var sessionKey = req.headers.authorization;
  var sessionUser = (0, _auth.getAuthUser)(sessionKey);

  _DBconfig.pool.getConnection(function (err, connection) {
    if (err) {
      console.log(err);
      res.json({ err: err });
    } else {
      var query = '\n      SELECT A.id, A.user_id, A.address1, A.address2, A.zipcode\n        FROM address AS A INNER JOIN user AS B\n          ON A.user_id = B.id\n       WHERE B.account = \'' + sessionUser.account + '\'\n      ';

      (0, _queryConductor.queryConductor)(connection, query).then(function (addressList) {
        res.json({ addressList: addressList });
        connection.release();
      });
    }
  });
});

module.exports = router;

//# sourceMappingURL=address-compiled.js.map