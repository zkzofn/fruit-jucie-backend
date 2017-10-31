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
}).post("/", function (req, res) {
  _DBconfig.pool.getConnection(function (err, connection) {
    if (err) throw err;

    var data = req.body;
    var orderKeys = Object.keys(data).filter(function (key) {
      return key !== "items";
    });
    var items = data.items;


    connection.beginTransaction(function (err) {
      if (err) throw err;

      new Promise(function (resolve, reject) {
        var orderKeyString = "";
        var orderValueString = "";

        orderKeys.forEach(function (key) {
          orderKeyString += key + ", ";

          // if (key === "user_id" || key === "status" || key === "total_price")
          //   orderValueString += `${data[key]}, `;
          // else
          //  // for string values
          orderValueString += '"' + data[key] + '", ';
        });

        orderKeyString += "date";
        orderValueString += "now()";

        // cart_detail 의 status 바꿔줘야해
        // order_detail에 cart_detail에 있는 내용들 넣어줘야해

        var query = 'INSERT INTO `order`\n                (' + orderKeyString + ')\n         VALUES (' + orderValueString + ')';

        (0, _queryConductor.queryConductor)(connection, query).then(function (results) {
          resolve({ results: results });
        }).catch(function (err) {
          connection.rollback(function () {
            throw err;
          });
        });
      }).then(function (_ref) {
        var results = _ref.results;

        var orderId = results.insertId;

        var query = 'INSERT INTO order_detail\n                (order_id, product_id, product_option_id, count)\n                SELECT "' + orderId + '", product_id, product_option_id, count\n                  FORM cart_detail\n                 WHERE user_id = ' + data.user_id + '\n                   AND status = 0';

        return (0, _queryConductor.queryConductor)(connection, query).catch(function (err) {
          connection.rollback(function () {
            throw err;
          });
        });
      }).then(function () {
        var query = 'UPDATE cart_detail\n            SET status = 1\n          WHERE user_id = ' + data.user_id + '\n            AND status = 0';

        return (0, _queryConductor.queryConductor)(connection, query).then(function () {
          connection.commit(function (err) {
            if (err) connection.rollback(function () {
              throw err;
            });
          });
        }).catch(function (err) {
          connection.rollback(function () {
            throw err;
          });
        });
      }).then(function () {
        console.log("Post order success");
        connection.release();
      }).catch(function (err) {
        if (err) throw err;
        connection.release();
      });
    });
  });
});

module.exports = router;

//# sourceMappingURL=order-compiled.js.map