'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _DBconfig = require('./DBconfig');

var _queryConductor = require('./queryConductor');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

router.get("/order", function (req, res, next) {
  try {
    _DBconfig.pool.getConnection(function (err, connection) {
      if (err) throw err;
      var userId = req.query.userId;


      var query = 'SELECT *\n         FROM `order`\n        WHERE user_id = ' + userId;

      (0, _queryConductor.queryConductor)(connection, query).then(function (orders) {
        var orderIdString = "";

        orders.forEach(function (order, index, array) {
          orderIdString += index === array.length - 1 ? order.id : order.id + ', ';
        });

        var query = 'SELECT *\n             FROM order_detail\n            WHERE order_id in (' + orderIdString + ')';

        (0, _queryConductor.queryConductor)(connection, query).then(function (order_details) {
          // order_detail의 product_id / product_option_id 별로 product, product_option에서
          // 정보 가져와서 json만들어서 response해야해


          orders.forEach(function (order) {
            order.order_details = order_details.filter(function (order_detail) {
              return order.id === order_detail.order_id;
            });
          });

          res.json({ orders: orders });
          connection.release();
        }, function (err) {
          console.log("Error occurs while SELECT FROM order_detail in getMyPageOrder");
          connection.release();
          throw err;
        });
      }, function (err) {
        console.log("Error occurs while SELECT FROM order in getMyPageOrder");
        connection.release();
        throw err;
      });
    });
  } catch (err) {
    res.json({ err: err });
  }
});

module.exports = router;

//# sourceMappingURL=myPage-compiled.js.map