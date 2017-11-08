'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _DBconfig = require('./DBconfig');

var _queryConductor = require('./queryConductor');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

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

          var uniqProductIds = _lodash2.default.uniqBy(order_details, "product_id").map(function (order_detail) {
            return order_detail.product_id;
          });

          var uniqProductOptionsIds = _lodash2.default.uniqBy(order_details, "product_option_id").filter(function (order_detail) {
            return order_detail.product_option_id !== null;
          }).map(function (order_detail) {
            return order_detail.product_option_id;
          });

          var productIdString = "";
          var productOptionIdString = "";

          uniqProductIds.forEach(function (productId, index, array) {
            productIdString += index === array.length - 1 ? productId : productId + ', ';
          });

          uniqProductOptionsIds.forEach(function (productOptionId, index, array) {
            productOptionIdString += index === array.length - 1 ? productOptionId : productOptionId + ', ';
          });

          new Promise(function (resolve, reject) {
            var query = 'SELECT *\n                     FROM product\n                    WHERE id in (' + productIdString + ')';

            (0, _queryConductor.queryConductor)(connection, query).then(function (products) {
              resolve(products);
            }, function (err) {
              console.log("Error occurs while SELECT FROM product in getMyPageOrder");
              connection.release();
              throw err;
            });
          }).then(function (products) {
            var query = 'SELECT *\n                     FROM product_option\n                    WHERE id in (' + productOptionIdString + ')';

            return (0, _queryConductor.queryConductor)(connection, query).then(function (productOptions) {
              return { products: products, productOptions: productOptions };
            }, function (err) {
              console.log("Error occurs while SELECT FROM product_option in getMyPageOrder");
              connection.release();
              throw err;
            });
          }).then(function (_ref) {
            var products = _ref.products,
                productOptions = _ref.productOptions;

            orders.forEach(function (order) {
              order.order_details = order_details.filter(function (order_detail) {
                return order.id === order_detail.order_id;
              });
            });

            res.json({ orders: orders, products: products, productOptions: productOptions });
            connection.release();
          });
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