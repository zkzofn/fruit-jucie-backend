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

    new Promise(function (resolve, reject) {
      var query = 'SELECT * \n           FROM product \n          WHERE id = ' + req.query.productId;

      (0, _queryConductor.queryConductor)(connection, query).then(function (results) {
        var product = results[0];

        resolve(product);
      });
    }).then(function (product) {
      var query = 'SELECT *\n           FROM product_option\n          WHERE product_id = ' + req.query.productId;

      return (0, _queryConductor.queryConductor)(connection, query).then(function (results) {
        product["options"] = results;

        return product;
      });
    }).then(function (product) {
      var query = 'SELECT * \n           FROM product_detail\n          WHERE product_id = ' + req.query.productId;

      return (0, _queryConductor.queryConductor)(connection, query).then(function (results) {
        product["details"] = results;

        return product;
      });
    }).then(function (product) {
      // 이거 페이지 기능 넣어서 쿼리 수정해야해
      var query = 'SELECT *\n           FROM post_script\n          WHERE product_id = ' + req.query.productId;

      (0, _queryConductor.queryConductor)(connection, query).then(function (results) {
        product["post_script"] = results;

        res.json({ product: product });
        connection.release();
      });
    });
  });
});

module.exports = router;

//# sourceMappingURL=product-compiled.js.map