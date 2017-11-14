'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _DBconfig = require('./DBconfig');

var _queryConductor = require('./queryConductor');

var _bcrypt = require('bcrypt');

var _bcrypt2 = _interopRequireDefault(_bcrypt);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

/**
 * @file /routes/users.js
 * @brief 로그인 API
 * @author 이장호
 * @date 2017-11-14
 *
 * @body {
 *   account: 사용자 ID
 *   password: 비밀번호
 * }
 *
 * @sequence
 * 1. 입력 값이 모두 입력되었는지 확인
 * 2. 아이디에 해당하는 비밀번호가 일치하는지 확인
 * 3. 일치하는 경우 session 정보 설정
 *     session.account = account;
 *     session.name = name;
 *     session.nickname = nickname;
 *     session.divider = 1;
 *     session.email = email;
 *
 * @return null
 */
router.get("/", function (req, res) {
  var sess = req.session;

  sess.numbeeer = "123";

  if (sess.id) console.log("there");else console.log("no there");

  res.json({ sess: sess });
}).get('/test', function (req, res) {
  var sess = req.session;

  res.json(sess);
})
/**
 * @file /routes/users.js
 * @brief 회원가입 API
 * @author 이장호
 * @date 2017-11-14
 *
 * @body {
 *   account: 사용자 ID
 *   name: 사용자 이름
 *   nickname: 닉네임
 *   password: 비밀번호
 *   phone: 핸드폰 번호
 *   zipcode: 우편번호
 *   address1: 주소
 *   address2: 상세주소
 *   email: 이메일
 *   join_route: 가입경로
 *     0: normal
 *     1: facebook
 *     2: instagram
 *     3: kakao
 * }
 *
 * @sequence
 * 1. 입력 값이 모두 입력되었는지 확인
 * 2. 기존에 id 가 있는지 확인
 * 3. 비밀번호 Hash 생성
 * 4. user 테이블에 회원정보 입력
 * 5. session setting
 *
 * @return null
 */
.post('/', function (req, res) {
  _DBconfig.pool.getConnection(function (err, connection) {
    console.log(req.session);

    var _req$body = req.body,
        account = _req$body.account,
        name = _req$body.name,
        nickname = _req$body.nickname,
        phone = _req$body.phone,
        zipcode = _req$body.zipcode,
        address1 = _req$body.address1,
        address2 = _req$body.address2,
        email = _req$body.email,
        join_route = _req$body.join_route;
    var password = req.body.password;


    new Promise(function (resolve, reject) {
      if (!(account && password && name && nickname && phone && zipcode && address1 && address2 && email)) {
        var msg = "Wrong request body in # POST /user";
        reject(msg);
      } else {
        resolve();
      }
    }).then(function () {
      var query = '\n      SELECT account\n        FROM user\n       WHERE account = "' + account + '"';

      (0, _queryConductor.queryConductor)(connection, query).then(function (results) {
        if (results.length > 0) {
          var msg = "There is already account.";
          console.log(msg);
          res.status(403).json({ msg: msg });
        } else {
          var saltRounds = 10;

          _bcrypt2.default.hash(password, saltRounds, function (error, hash) {
            if (error) {
              var _msg = "Error occurs while CREATE HASH PASSWORD in # POST /user";

              console.log(error);
              console.log(_msg);
              res.status(500).json({ error: error, msg: _msg });
            } else {
              password = hash;

              connection.beginTransaction(function (error) {
                if (error) {
                  var _msg2 = "Error occurs while TRANSACTION in # POST /user";
                  console.log(error);
                  console.log(_msg2);
                  res.status(500).json({ error: error, msg: _msg2 });
                } else {
                  // SHA1("test6")
                  // a66df261120b6c2311c6ef0b1bab4e583afcbcc0

                  var _query = '\n                  INSERT INTO user (\n                    account,\n                    name,\n                    nickname,\n                    password,\n                    divider,\n                    phone,\n                    zipcode,\n                    address1,\n                    address2,\n                    email,\n                    enroll_date,\n                    join_route\n                  ) VALUES (\n                    "' + account + '",\n                    "' + name + '",\n                    "' + nickname + '",\n                    "' + password + '",\n                    1,\n                    "' + phone + '",\n                    "' + zipcode + '",\n                    "' + address1 + '",\n                    "' + address2 + '",\n                    "' + email + '",\n                    now(),\n                    ' + join_route + '\n                  )';

                  (0, _queryConductor.queryConductor)(connection, _query).then(function () {
                    connection.commit(function (error) {
                      if (error) {
                        var _msg3 = "Error occurs while COMMIT in # POST /user";

                        console.log(error);
                        console.log(_msg3);
                        connection.rollback(function () {
                          connection.release();
                          res.status(500).json({ error: error, msg: _msg3 });
                        });
                      } else {
                        var session = req.session;

                        session.account = account;
                        session.name = name;
                        session.nickname = nickname;
                        session.divider = 1;
                        session.email = email;

                        connection.release();
                        res.end();
                      }
                    });
                  }, function (error) {
                    var msg = "Error occurs while INSERT INTO user in # POST /user";

                    console.log(error);
                    console.log(msg);
                    connection.rollback(function () {
                      connection.release();
                      res.status(500).json({ error: error, msg: msg });
                    });
                  });
                }
              });
            }
          });
        }
      });
    }).catch(function (error) {
      console.log(error);
      res.status(500).json({ error: error });
    });
  });
});

module.exports = router;

//# sourceMappingURL=user-compiled.js.map