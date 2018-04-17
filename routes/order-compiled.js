'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _DBconfig = require('./DBconfig');

var _queryConductor = require('./queryConductor');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

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
        var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(error) {
          var _msg;

          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  if (!error) {
                    _context.next = 8;
                    break;
                  }

                  _msg = "Error occurs while beginTransaction in # POST /order";

                  console.log(error);
                  console.log(_msg);
                  connection.release();
                  res.status(500).json({ error: error, msg: _msg });
                  _context.next = 10;
                  break;

                case 8:
                  _context.next = 10;
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
                  }).catch(function (_ref2) {
                    var error = _ref2.error,
                        msg = _ref2.msg;

                    connection.rollback(function () {
                      console.log(error);
                      console.log(msg);
                      connection.release();
                      res.status(500).json({ error: error, msg: msg });
                    });
                  });

                case 10:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, undefined);
        }));

        return function (_x) {
          return _ref.apply(this, arguments);
        };
      }());
    }
  });
});

module.exports = router;

//# sourceMappingURL=order-compiled.js.map