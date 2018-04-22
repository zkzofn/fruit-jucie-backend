'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _DBconfig = require('./DBconfig');

var _queryConductor = require('./queryConductor');

var _auth = require('./auth');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var router = _express2.default.Router();

router.get("/user", function (req, res, next) {
  var sessionKey = req.headers.authorization;
  var sessionUser = (0, _auth.getAuthUser)(sessionKey);
  var userId = sessionUser.id;
  var endDate = req.query.endDate ? req.query.endDate : new Date();
  var startDate = req.query.startDate ? req.query.startDate : new Date();
  startDate.setMonth(startDate.getMonth() - 3);

  startDate = startDate.toISOString().slice(0, 10);
  endDate = endDate.toISOString().slice(0, 10);

  _DBconfig.pool.getConnection(function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(error, connection) {
      var msg;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (!error) {
                _context.next = 8;
                break;
              }

              msg = "Error occurs while pool.getConnection in # GET /order";

              console.log(error);
              console.log(msg);
              connection.release();
              res.status(500).json({ error: error, msg: msg });
              _context.next = 10;
              break;

            case 8:
              _context.next = 10;
              return new Promise(function (resolve, reject) {
                var query = '\n        SELECT A.id as order_id, A.date, A.status, A.payment_type, A.total_price, B.product_id, B.product_option_id, B.count, B.days, B.mon, B.tue, B.wed, B.thur, B.fri, C.image_path, C.name AS product_name, D.description\n          FROM `order` A INNER JOIN order_detail B\n            ON A.id = B.order_id\n         INNER JOIN product C\n            ON B.product_id = C.id\n          LEFT JOIN product_option D\n            ON B.product_option_id = D.id\n         WHERE A.user_id = ' + userId + '\n           AND A.date > "' + startDate + '"\n           AND A.date < "' + endDate + '"';

                (0, _queryConductor.queryConductor)(connection, query).then(function (results) {
                  resolve(results);
                }).catch(function (error) {
                  var msg = "Error occurs while SELECT order info in # GET /order/user";
                  reject({ error: error, msg: msg });
                });
              }).then(function (results) {
                var orders = _lodash2.default.groupBy(results, "order_id");

                for (var orderId in orders) {
                  orders[orderId] = _lodash2.default.groupBy(orders[orderId], "product_id");
                }

                return orders;
              }).then(function (results) {
                connection.release();
                res.json({ results: results });
              }).catch(function (_ref2) {
                var error = _ref2.error,
                    msg = _ref2.msg;

                console.log(error);
                console.log(msg);
                connection.release();
                res.status(500).json({ error: error, msg: msg });
              });

            case 10:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, undefined);
    }));

    return function (_x, _x2) {
      return _ref.apply(this, arguments);
    };
  }());
}).post("/", function (req, res) {
  var _req$body = req.body,
      orderInfo = _req$body.orderInfo,
      fromCart = _req$body.fromCart,
      items = _req$body.items;

  var orderKeys = Object.keys(orderInfo);

  _DBconfig.pool.getConnection(function (error, connection) {
    if (error) {
      var msg = "Error occurs while pool.getConnection in # POST /order";
      console.log(error);
      console.log(msg);
      connection.release();
      res.status(500).json({ error: error, msg: msg });
    } else {
      connection.beginTransaction(function () {
        var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(error) {
          var _msg;

          return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  if (!error) {
                    _context2.next = 8;
                    break;
                  }

                  _msg = "Error occurs while beginTransaction in # POST /order";

                  console.log(error);
                  console.log(_msg);
                  connection.release();
                  res.status(500).json({ error: error, msg: _msg });
                  _context2.next = 10;
                  break;

                case 8:
                  _context2.next = 10;
                  return new Promise(function (resolve, reject) {
                    var orderKeyString = "";
                    var orderValueString = "";

                    orderKeys.forEach(function (key) {
                      orderKeyString += key + ", ";
                      orderValueString += '"' + orderInfo[key] + '", ';
                    });

                    orderKeyString += "date";
                    orderValueString += "now()";

                    var query = '\n            INSERT INTO `order`\n                   (' + orderKeyString + ')\n            VALUES (' + orderValueString + ')';

                    (0, _queryConductor.queryConductor)(connection, query).then(function (results) {
                      resolve(results);
                    }).catch(function (error) {
                      var msg = "Error occurs while INSERT INTO order information in # POST /order";
                      reject({ error: error, msg: msg });
                    });
                  }).then(function (results) {
                    var orderId = results.insertId;
                    var orderDetailValues = items.map(function (item) {
                      var product = item.product,
                          options = item.options;


                      if (options.length === 0) {
                        return '(\n                  ' + orderId + ',\n                  ' + product.id + ',\n                  NULL,\n                  ' + product.count + ',\n                  ' + product.days + ',\n                  ' + product.daysCondition.mon + ',\n                  ' + product.daysCondition.tue + ',\n                  ' + product.daysCondition.wed + ',\n                  ' + product.daysCondition.thur + ',\n                  ' + product.daysCondition.fri + '\n                )';
                      } else {
                        return options.map(function (option) {
                          return '(\n                    ' + orderId + ',\n                    ' + product.id + ',\n                    ' + option.id + ',\n                    ' + option.count + ',\n                    ' + product.days + ',\n                    ' + product.daysCondition.mon + ',\n                    ' + product.daysCondition.tue + ',\n                    ' + product.daysCondition.wed + ',\n                    ' + product.daysCondition.thur + ',\n                    ' + product.daysCondition.fri + '\n                  )';
                        }).join(", ");
                      }
                    }).join(", ");

                    var query = '\n            INSERT INTO order_detail\n                   (order_id, product_id, product_option_id, count, days, mon, tue, wed, thur, fri)\n            VALUES ' + orderDetailValues;

                    return (0, _queryConductor.queryConductor)(connection, query).catch(function (error) {
                      var msg = "Error occurs while INSERT INTO order_detail information in # POST /order";
                      throw { error: error, msg: msg };
                    });
                  }).then(function () {
                    if (fromCart) {
                      var query = '\n              UPDATE cart_detail\n                 SET status = 1\n               WHERE user_id = ' + orderInfo.user_id + '\n                 AND status = 0';

                      return (0, _queryConductor.queryConductor)(connection, query).catch(function (error) {
                        var msg = "Error occurs while UPDATE cart_detail information in # POST /order";
                        throw { error: error, msg: msg };
                      });
                    }
                  }).then(function () {
                    connection.commit(function (error) {
                      if (error) {
                        var _msg2 = "Error occurs while COMMIT in # POST /order";
                        connection.release();
                        res.status(500).json({ error: error, msg: _msg2 });
                      } else {
                        connection.release();
                        res.end();
                      }
                    });
                  }).catch(function (_ref4) {
                    var error = _ref4.error,
                        msg = _ref4.msg;

                    connection.rollback(function () {
                      console.log(error);
                      console.log(msg);
                      connection.release();
                      res.status(500).json({ error: error, msg: msg });
                    });
                  });

                case 10:
                case 'end':
                  return _context2.stop();
              }
            }
          }, _callee2, undefined);
        }));

        return function (_x3) {
          return _ref3.apply(this, arguments);
        };
      }());
    }
  });
});

module.exports = router;

//# sourceMappingURL=order-compiled.js.map