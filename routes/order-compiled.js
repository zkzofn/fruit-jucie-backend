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
        var keys = Object.keys(data);

        var keyString = "";
        var valueString = "";

        keys.forEach(function (key) {
            keyString += key + ", ";

            if (key === "user_id" || key === "status" || key === "total_price") valueString += data[key] + ', ';else valueString += '"' + data[key] + '", ';
        });

        keyString += "date";
        valueString += "now()";

        // cart_detail 의 status 바꿔줘야해
        // order_detail에 cart_detail에 있는 내용들 넣어줘야해

        var query = 'INSERT INTO `order`\n              (' + keyString + ')\n       VALUES (' + valueString + ')';

        console.log(query);

        (0, _queryConductor.queryConductor)(connection, query).then(function (results) {
            res.json(results);
            connection.release();
        });
    });
});

module.exports = router;

//# sourceMappingURL=order-compiled.js.map