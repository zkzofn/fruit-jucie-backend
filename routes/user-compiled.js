'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _DBconfig = require('./DBconfig');

var _expressSession = require('express-session');

var _expressSession2 = _interopRequireDefault(_expressSession);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

router.get("/", function (req, res, next) {
  _DBconfig.pool.getConnection(function (err, connection) {
    if (err) throw err;

    var getQuery = function getQuery(query) {
      return new Promise(function (resolve, reject) {
        connection.query(query, function (error, results) {
          if (error) reject(error);

          resolve(results);
        });
      });
    };

    new Promise(function (resolve, reject) {
      var query = 'SELECT * \n           FROM user \n          WHERE id = ' + req.query.userId;

      return getQuery(query).then(function (results) {
        var user = results[0];
        resolve(user);
      });
    }).then(function (user) {
      // 사용자정보에서 민감정보는 뺴야한다.

      res.json({ user: user });
      connection.release();
    });
  });
}).get("/login", function (req, res) {
  var sess = req.session;

  console.log(req);

  if (sess.id) console.log("there");else console.log("no there");

  res.json({ sess: sess });
});

module.exports = router;

//# sourceMappingURL=user-compiled.js.map