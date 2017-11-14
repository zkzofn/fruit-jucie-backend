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
  try {
    _DBconfig.pool.getConnection(function (err, connection) {
      if (err) throw err;

      var data = req.body;
      var orderKeys = Object.keys(data).filter(function (key) {
        return key !== "items";
      });

      connection.beginTransaction(function (err) {
        if (err) throw err;

        var orderKeyString = "";
        var orderValueString = "";

        orderKeys.forEach(function (key) {
          orderKeyString += key + ", ";
          orderValueString += '"' + data[key] + '", ';
        });

        orderKeyString += "date";
        orderValueString += "now()";

        var query = 'INSERT INTO `order`\n                  (' + orderKeyString + ')\n           VALUES (' + orderValueString + ')';

        (0, _queryConductor.queryConductor)(connection, query).then(function (results) {
          var orderId = results.insertId;
          var query = 'INSERT INTO order_detail\n                    (order_id, product_id, product_option_id, count)\n                    SELECT ' + orderId + ', product_id, product_option_id, count\n                      FROM cart_detail\n                     WHERE user_id = ' + data.user_id + '\n                       AND status = 0';

          (0, _queryConductor.queryConductor)(connection, query).then(function () {
            var query = 'UPDATE cart_detail\n                      SET status = 1\n                    WHERE user_id = ' + data.user_id + '\n                      AND status = 0';

            (0, _queryConductor.queryConductor)(connection, query).then(function () {
              connection.commit(function (err) {
                if (err) {
                  console.log("error 4");
                  connection.rollback(function () {
                    connection.release();
                    throw err;
                  });
                }
                console.log('user id = ' + data.user_id + ' postOrder success');
                connection.release();
                res.end();
              });
            }, function (err) {
              console.log("Error occurs while UPDATE cart_detail information in postOrder.");
              connection.rollback(function () {
                connection.release();
                throw err;
              });
            });
          }, function (err) {
            console.log("Error occurs while INSERT INTO order_detail information in postOrder.");
            connection.rollback(function () {
              connection.release();
              throw err;
            });
          });
        }, function (err) {
          console.log("Error occurs while INSERT INTO order information in postOrder.");
          connection.rollback(function () {
            connection.release();
            throw err;
          });
        });
      });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error });
  }
});

module.exports = router;

//# sourceMappingURL=order-compiled.js.map