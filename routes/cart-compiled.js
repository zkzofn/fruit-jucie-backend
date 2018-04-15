'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _DBconfig = require('./DBconfig');

var _queryConductor = require('./queryConductor');

var _auth = require('./auth');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

router.get("/", function (req, res) {
  var sessionKey = req.headers.authorization;
  var sessionUser = (0, _auth.getAuthUser)(sessionKey);

  // select * 로 검색한 애들 전부다 필요한 것들만 select 걸러줘야 해
  _DBconfig.pool.getConnection(function (err, connection) {
    if (err) throw err;

    var userId = sessionUser.id;

    new Promise(function (resolve, reject) {
      var query = '\n      SELECT * \n        FROM cart_detail\n       WHERE user_id = ' + userId + '\n         AND status = 0';

      (0, _queryConductor.queryConductor)(connection, query).then(function (cartProducts) {
        resolve({ cartProducts: cartProducts });
      });
    }).then(function (_ref) {
      var cartProducts = _ref.cartProducts;

      var query = 'SELECT product_id\n           FROM cart_detail\n          WHERE user_id = ' + userId + '\n            AND status = 0\n          GROUP BY product_id';

      return (0, _queryConductor.queryConductor)(connection, query).then(function (distinctCartProducts) {
        return { cartProducts: cartProducts, distinctCartProducts: distinctCartProducts };
      });
    }).then(function (_ref2) {
      var cartProducts = _ref2.cartProducts,
          distinctCartProducts = _ref2.distinctCartProducts;

      var query = '\n      SELECT B.* \n        FROM cart_detail A INNER JOIN product B\n          ON A.product_id = B.id\n       WHERE A.user_id = ' + userId + '\n         AND status = 0\n       GROUP BY B.id';

      return (0, _queryConductor.queryConductor)(connection, query).then(function (products) {
        return { cartProducts: cartProducts, distinctCartProducts: distinctCartProducts, products: products };
      });
    }).then(function (_ref3) {
      var cartProducts = _ref3.cartProducts,
          distinctCartProducts = _ref3.distinctCartProducts,
          products = _ref3.products;

      var query = '\n      SELECT B.*\n        FROM cart_detail A INNER JOIN product_option B\n          ON A.product_option_id = B.id\n       WHERE A.user_id = ' + userId + '\n         AND status = 0\n       GROUP BY B.id';

      return (0, _queryConductor.queryConductor)(connection, query).then(function (productOptions) {
        return { cartProducts: cartProducts, distinctCartProducts: distinctCartProducts, products: products, productOptions: productOptions };
      });
    }).then(function (_ref4) {
      var cartProducts = _ref4.cartProducts,
          distinctCartProducts = _ref4.distinctCartProducts,
          products = _ref4.products,
          productOptions = _ref4.productOptions;

      return new Promise(function (resolve) {
        var cart = distinctCartProducts.map(function (distinctCartProduct) {
          distinctCartProduct["product"] = products.filter(function (product) {
            return product.id === distinctCartProduct.product_id;
          })[0];

          var targetProduct = cartProducts.filter(function (cartProduct) {
            return distinctCartProduct.product_id === cartProduct.product_id;
          })[0];

          var count = targetProduct.count,
              days = targetProduct.days,
              mon = targetProduct.mon,
              tue = targetProduct.tue,
              wed = targetProduct.wed,
              thur = targetProduct.thur,
              fri = targetProduct.fri;


          distinctCartProduct["product"]["cartId"] = targetProduct.id;
          distinctCartProduct["product"]["count"] = count;
          distinctCartProduct["product"]["days"] = days;
          distinctCartProduct["product"]["daysCondition"] = {
            mon: mon, tue: tue, wed: wed, thur: thur, fri: fri
          };

          distinctCartProduct["options"] = cartProducts.filter(function (cartProduct) {
            return distinctCartProduct.product_id === cartProduct.product_id && cartProduct.product_option_id !== null;
          }).map(function (cartProduct) {
            var cartId = cartProduct.id;
            var count = cartProduct.count;

            cartProduct = productOptions.filter(function (productOption) {
              return productOption.id === cartProduct.product_option_id;
            })[0];

            cartProduct["cartId"] = cartId;
            cartProduct["count"] = count;

            return cartProduct;
          });

          return distinctCartProduct;
        });

        resolve(cart);
      });
    }).then(function (cart) {
      res.json({ cart: cart });
      connection.release();
    });
  });
}).post("/", function (req, res) {
  _DBconfig.pool.getConnection(function (err, connection) {
    if (err) throw err;

    var sessionKey = req.headers.authorization;
    var sessionUser = (0, _auth.getAuthUser)(sessionKey);
    var userId = sessionUser.id;

    var _req$body = req.body,
        product = _req$body.product,
        selectedOptions = _req$body.selectedOptions;

    var productOptionIdsString = selectedOptions.join(', ');
    var productOptionCondition = 'AND product_option_id in (' + productOptionIdsString + ')';
    var daysCount = 0;
    var daysCondition = "";
    var daysKeys = "";
    var daysValues = "";

    Object.keys(product.daysCondition).forEach(function (day) {
      if (product.daysCondition[day]) {
        daysKeys += ' ' + day + ', ';
        daysValues += ' true, ';
        daysCondition += ' AND ' + day + ' = true ';
        daysCount++;
      }
    });

    connection.beginTransaction(function (err) {
      if (err) {
        return connection.rollback(function () {
          throw err;
        });
      }

      var query = '\n      SELECT id, product_option_id\n        FROM cart_detail\n       WHERE user_id = ' + userId + '\n         AND product_id = ' + product.id + '\n         ' + (selectedOptions.length > 0 ? productOptionCondition : "") + '\n         AND status = 0\n         ' + (daysCount > 0 ? daysCondition : "") + '\n         ';

      (0, _queryConductor.queryConductor)(connection, query).catch(function (err) {
        if (err) {
          return connection.rollback(function () {
            throw err;
          });
        }
      }).then(function (results) {
        if (selectedOptions.length === 0 && results.length === 0) {
          var _query = '\n          INSERT INTO cart_detail\n                 (user_id, product_id, count, status, ' + (daysCount > 0 ? daysKeys : "") + ' date)\n          VALUES (' + userId + ', ' + product.id + ', ' + product.count + ', 0, ' + (daysCount > 0 ? daysValues : "") + ' now())';

          (0, _queryConductor.queryConductor)(connection, _query).catch(function (err) {
            if (err) {
              return connection.rollback(function () {
                throw err;
              });
            }
          }).then(function (insertResults) {
            connection.commit(function (err) {
              if (err) {
                return connection.rollback(function () {
                  throw err;
                });
              }

              // 이 부분은 아마 insertResults 값 없을거야 확인해보고 수정해
              res.json({ insertResults: insertResults });
              connection.release();
            });
          });
        } else if (selectedOptions.length === 0 && results.length > 0) {
          var _query2 = '\n          UPDATE cart_detail\n            SET count = count + ' + product.count + ', date = now()\n          WHERE id = ' + results[0].id;

          (0, _queryConductor.queryConductor)(connection, _query2).catch(function (err) {
            if (err) {
              return connection.rollback(function () {
                throw err;
              });
            }
          }).then(function (updateResults) {
            connection.commit(function (err) {
              if (err) {
                return connection.rollback(function () {
                  throw err;
                });
              }

              // 이 부분은 아마 insertResults 값 없을거야 확인해보고 수정해
              res.json({ updateResults: updateResults });
              connection.release();
            });
          });
        } else if (selectedOptions.length > 0) {
          new Promise(function (resolve) {
            var _loop = function _loop(i) {
              var lengthChecker = results.filter(function (result) {
                return result.product_option_id === selectedOptions[i].id;
              });

              if (lengthChecker.length === 0) {
                var _query3 = '\n                INSERT INTO cart_detail\n                       (user_id, product_id, product_option_id, count, status, date)\n                VALUES (' + userId + ', ' + product.id + ', ' + selectedOptions[i].id + ', ' + selectedOptions[i].count + ', 0, now())';

                (0, _queryConductor.queryConductor)(connection, _query3).catch(function (err) {
                  if (err) {
                    return connection.rollback(function () {
                      throw err;
                    });
                  }
                }).then(function () {
                  if (i === selectedOptions.length - 1) resolve();
                });
              } else {
                var _query4 = '\n                UPDATE cart_detail\n                   SET count = count + ' + selectedOptions[i].count + '\n                 WHERE id = ' + lengthChecker[0].id;

                (0, _queryConductor.queryConductor)(connection, _query4).catch(function (err) {
                  if (err) {
                    return connection.rollback(function () {
                      throw err;
                    });
                  }
                }).then(function () {
                  if (i === selectedOptions.length - 1) resolve();
                });
              }
            };

            for (var i = 0; i < selectedOptions.length; i++) {
              _loop(i);
            }
          }).then(function () {
            connection.commit(function (err) {
              if (err) {
                return connection.rollback(function () {
                  throw err;
                });
              }

              // 이 부분 어떻게 해야 좋을지 좀 생각해봐봐
              res.json({ result: "success" });
              connection.release();
            });
          });
        }
      });
    });
  });
}).patch("/", function (req, res) {
  _DBconfig.pool.getConnection(function (err, connection) {
    if (err) throw err;

    var _req$body2 = req.body,
        cartId = _req$body2.cartId,
        value = _req$body2.value;

    var query = '\n    UPDATE cart_detail\n       SET count = count + ' + value + '\n     WHERE id = ' + cartId;

    console.log(query);

    (0, _queryConductor.queryConductor)(connection, query).then(function () {
      console.log("success");
      res.json({});
      connection.release();
    }).catch(function (err) {
      console.log("fail");
      res.status(500).json({ err: err });
      connection.release();
    });
  });
}).delete("/", function (req, res) {
  _DBconfig.pool.getConnection(function (err, connection) {
    if (err) throw err;

    var cartId = req.body.cartId;

    var query = '\n    UPDATE cart_detail\n       SET status = 2\n     WHERE id = ' + cartId;

    (0, _queryConductor.queryConductor)(connection, query).then(function () {
      res.json({});
      connection.release();
    }).catch(function (err) {
      res.json({ err: err });
      connection.release();
    });
  });
});

module.exports = router;

//# sourceMappingURL=cart-compiled.js.map