'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _DBconfig = require('./DBconfig');

var _queryConductor = require('./queryConductor');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var router = _express2.default.Router();

router.get("/", function (req, res) {
  _DBconfig.pool.getConnection(function (err, connection) {
    if (err) throw err;
    var userId = req.query.userId;


    new Promise(function (resolve, reject) {
      var query = 'SELECT * \n           FROM cart_detail\n          WHERE user_id = ' + userId + '\n            AND status = 0';

      (0, _queryConductor.queryConductor)(connection, query).then(function (cartProducts) {
        resolve(cartProducts);
      });
    }).then(function (cartProducts) {
      // const cart = cartProducts.map(cartProduct => {
      //   const query =
      //     `SELECT *
      //      FROM product
      //     WHERE id = ${cartProduct.product_id}`;
      //
      //   connection.query(query, (error, results) => {
      //     if (error) throw error;
      //
      //     cartProduct["product"] = results[0];
      //
      //     return cartProduct;
      //   });
      // });

      cartProducts.forEach(function (cartProduct, index, arr) {
        var query = 'SELECT *\n               FROM product\n              WHERE id = ' + cartProduct.product_id;

        connection.query(query, function (error, results) {
          if (error) throw error;

          cartProduct["product"] = results[0];

          if (index == arr.length - 1) {
            return Promise.resolve(arr);
          }
        });
      });
    }).then(function (cart) {
      console.log(cart);
      res.json({ cart: cart });
      connection.release();
    });
  });
}).post("/", function (req, res) {
  _DBconfig.pool.getConnection(function (err, connection) {
    var userId = req.body.userId;
    var product = req.body.product;
    var selectedOptions = req.body.selectedOptions;


    if (selectedOptions.length === 0) {
      var query = 'INSERT INTO cart_detail\n                (user_id, product_id, count, status, date)\n         VALUES (' + userId + ', ' + product.id + ', ' + product.count + ', 0, now())';

      (0, _queryConductor.queryConductor)(connection, query).then(function (results) {

        res.json({ results: results });
        connection.release();
      });
    } else {
      new Promise(function (resolve, reject) {
        var resResults = [];

        for (var i = 0; i < selectedOptions.length; i++) {
          var _query = 'INSERT INTO cart_detail\n                    (user_id, product_id, product_option_id, count, status, date)\n             VALUES (' + userId + ', ' + product.id + ', ' + selectedOptions[i].id + ', ' + selectedOptions[i].count + ', 1, now())';
          (0, _queryConductor.queryConductor)(connection, _query).then(function (results) {
            resResults = [].concat(_toConsumableArray(resResults), [results]);
          });
          // .catch(error => {
          //   res.json({error});
          //   connection.release();
          // })
        }
        resolve(resResults);
      }).then(function (resResults) {
        res.json({ resResults: resResults });
        connection.release();
      });
    }
  });
});

module.exports = router;

//# sourceMappingURL=cart-compiled.js.map