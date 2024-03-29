'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _DBconfig = require('./DBconfig');

var _queryConductor = require('./queryConductor');

var _bcrypt = require('bcrypt');

var _bcrypt2 = _interopRequireDefault(_bcrypt);

var _redis = require('redis');

var _redis2 = _interopRequireDefault(_redis);

var _auth = require('./auth');

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
 * 3. 비밀번호가 일치하는 경우 session 정보 설정
 *     session.account = account;
 *     session.name = name;
 *     session.nickname = nickname;
 *     session.divider = 1;
 *     session.email = email;
 *
 * @return null
 */
router.post("/login", function (req, res) {
  var account = req.body.account;

  var redisClient = _redis2.default.createClient();

  var passwordOriginal = req.body.password;

  _DBconfig.pool.getConnection(function (error, connection) {
    new Promise(function (resolve, reject) {
      // 1. 입력 값이 모두 입력되었는지 확인
      if (!(account && passwordOriginal)) {
        var msg = "Wrong request body in # POST /user/login";
        reject(msg);
      } else {
        resolve();
      }
    }).then(function () {
      // 2. 아이디에 해당하는 비밀번호가 일치하는지 확인
      var query = '\n      SELECT id, account, name, nickname, password, divider, email\n        FROM user\n       WHERE account = "' + account + '"';

      (0, _queryConductor.queryConductor)(connection, query).then(function (results) {
        if (results.length === 0) {
          var msg = "로그인 정보가 잘못되었습니다.";
          console.log(msg);
          connection.release();
          res.json({ user: null, msg: msg });
        } else {
          var _results$ = results[0],
              id = _results$.id,
              _account = _results$.account,
              name = _results$.name,
              nickname = _results$.nickname,
              password = _results$.password,
              divider = _results$.divider,
              email = _results$.email;

          // 3. 비밀번호가 일치하는 경우 session 정보 설정

          _bcrypt2.default.compare(passwordOriginal, password, function (error, result) {
            if (error) {
              var _msg = "Error occurs while COMPARE PASSWORD in # POST /user/login";
              console.log(error);
              console.log(_msg);
              connection.release();
              res.status(500).json({ error: error, msg: _msg });
            } else {
              if (result) {
                var user = {
                  id: id,
                  account: _account,
                  name: name,
                  nickname: nickname,
                  divider: divider,
                  email: email
                };

                var userInfoString = JSON.stringify(user);
                var sessionKey = (0, _auth.makeSessionKey)(userInfoString);

                connection.release();

                redisClient.setex(sessionKey, _auth.sessionTimeout, userInfoString, function (error) {
                  redisClient.quit();
                  if (error) {
                    var _msg2 = "Error occurs SET REDIS KEY in # POST /user/login";
                    console.log(error);
                    console.log(_msg2);
                    res.status(500).json({ sessionKey: null, error: error, msg: _msg2 });
                  } else {
                    console.log(sessionKey);
                    res.json({ sessionKey: sessionKey, user: user });
                  }
                });
              } else {
                var _msg3 = "로그인 정보가 잘못되었습니다.";
                console.log(_msg3);
                connection.release();
                res.json({ sessionKey: null, msg: _msg3 });
              }
            }
          });
        }
      }, function (error) {
        var msg = "Error occurs while SELECT user in # POST /user/login";
        console.log(error);
        console.log(msg);
        connection.release();
        res.status(500).json({ error: error, msg: msg });
      });
    }).catch(function (error) {
      console.log(error);
      connection.release();
      res.status(400).json({ error: error });
    });
  });
})
/**
 * @file /routes/users.js
 * @brief 로그아웃 API
 * @author 이장호
 * @date 2017-11-17
 *
 * @sequence
 * 1. session 에 account 정보가 있는지 확인 (로그인 상태인지 확인)
 * 2-1. 로그인 상태이면 session 삭제 후 redirect -> "/"
 * 2-2. 로그인 상태가 아니라면 redirect -> "/"
 *
 * @return null
 */

.get('/logout', function (req, res) {
  var session = req.session;


  if (session.account) {
    req.session.destroy(function (error) {
      if (error) {
        var msg = "Error occurs while DESTROYING SESSION in # GET /user/logout";
        console.log(error);
        console.log(msg);
        res.status(500).json({ error: error, msg: msg });
      } else {
        res.redirect("/");
      }
    });
  } else {
    res.redirect("/");
  }
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
          connection.release();
          res.status(403).json({ msg: msg });
        } else {
          var saltRounds = 10;

          _bcrypt2.default.hash(password, saltRounds, function (error, hash) {
            if (error) {
              var _msg4 = "Error occurs while CREATE HASH PASSWORD in # POST /user";
              console.log(error);
              console.log(_msg4);
              connection.release();
              res.status(500).json({ error: error, msg: _msg4 });
            } else {
              password = hash;

              connection.beginTransaction(function (error) {
                if (error) {
                  var _msg5 = "Error occurs while TRANSACTION in # POST /user";
                  console.log(error);
                  console.log(_msg5);
                  connection.release();
                  res.status(500).json({ error: error, msg: _msg5 });
                } else {
                  // SHA1("test6")
                  // a66df261120b6c2311c6ef0b1bab4e583afcbcc0

                  var _query = '\n                  INSERT INTO user (\n                    account,\n                    name,\n                    nickname,\n                    password,\n                    divider,\n                    phone,\n                    zipcode,\n                    address1,\n                    address2,\n                    email,\n                    enroll_date,\n                    join_route\n                  ) VALUES (\n                    "' + account + '",\n                    "' + name + '",\n                    "' + nickname + '",\n                    "' + password + '",\n                    1,\n                    "' + phone + '",\n                    "' + zipcode + '",\n                    "' + address1 + '",\n                    "' + address2 + '",\n                    "' + email + '",\n                    now(),\n                    0\n                  )';

                  console.log(password);

                  (0, _queryConductor.queryConductor)(connection, _query).then(function () {
                    connection.commit(function (error) {
                      if (error) {
                        var _msg6 = "Error occurs while COMMIT in # POST /user";

                        console.log(error);
                        console.log(_msg6);
                        connection.rollback(function () {
                          connection.release();
                          res.status(500).json({ error: error, msg: _msg6 });
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
      connection.release();
      res.status(400).json({ error: error });
    });
  });
})
/**
 * @file /routes/users.js
 * @brief GET validate API
 * @author 이장호
 * @date 2017-11-20
 *
 * @sequence
 * 1. session 이 유효한지 확인
 * 2. 결과값 return
 *
 * @return 유효하다면 true 유효하지 않다면 false
 */
.get('/validate', function (req, res) {
  var redisClient = _redis2.default.createClient();
  var sessionKey = req.headers.authorization;

  redisClient.get(sessionKey, function (error, reply) {
    if (error) {
      var msg = "Error occurs while REDIS GET in # GET /user/validate";
      console.log(error);
      console.log(msg);
      redisClient.quit();
      res.status(500).json({ error: error, msg: msg });
    } else {
      if (reply) {
        redisClient.expire(sessionKey, 60 * 60, function (error, reply) {
          if (error) {
            var _msg7 = "Error occurs while REDIS EXPIREAT in #GET /user/validate";
            console.log(error);
            console.log(_msg7);
            redisClient.quit();
            res.status(500).json({ error: error, msg: _msg7 });
          } else {
            redisClient.quit();
            res.json({ validate: true });
          }
        });
      } else {
        res.json({ validate: false });
      }
    }
  });
})
/**
 * @file /routes/users.js
 * @brief GET user API
 * @author 이장호
 * @date 2017-11-20
 *
 * @sequence
 * 1. 사용자 정보 return
 *
 * @return user<Object>
 */
.get('/', function (req, res) {
  var sessionKey = req.headers.authorization;
  var sessionUser = (0, _auth.getAuthUser)(sessionKey);

  _DBconfig.pool.getConnection(function (err, connection) {
    if (err) {
      var msg = "Error occurs while pool.getConnection in # GET /user";

      console.log(err);
      console.log(msg);
      res.json({ err: err, msg: msg });
    } else {
      new Promise(function (resolve, reject) {
        var query = '\n        SELECT id, account, name, nickname, phone, address1, address2, email, zipcode\n          FROM user\n         WHERE account = \'' + sessionUser.account + '\';\n        ';

        (0, _queryConductor.queryConductor)(connection, query).then(function (results) {
          var user = results[0];

          res.json({ user: user });
          connection.release();
        });
      });
    }
  });
})
/**
 * @file /routes/users.js
 * @brief PATCH user API
 * @author 이장호
 * @date 2018-05-13
 *
 *
 */
.patch('/', function (req, res) {
  var sessionKey = req.headers.authorization;
  var sessionUser = (0, _auth.getAuthUser)(sessionKey);

  var _req$body2 = req.body,
      nickname = _req$body2.nickname,
      password = _req$body2.password,
      phone = _req$body2.phone,
      zipcode = _req$body2.zipcode,
      address1 = _req$body2.address1,
      address2 = _req$body2.address2;


  _DBconfig.pool.getConnection(function (err, connection) {
    if (err) {
      var msg = "Error occurs while pool.getConnection in # PATCH /user/userId";

      console.log(err);
      console.log(msg);
      res.json({ err: err, msg: msg });
    } else {
      new Promise(function (resolve, reject) {
        var query = '\n        UPDATE user\n           SET nickname = \'' + nickname + '\',\n               password = \'' + password + '\',\n               phone = \'' + phone + '\',\n               zipcode = \'' + zipcode + '\',\n               address1 = \'' + address1 + '\',\n               address2 = \'' + address2 + '\'\n         WHERE account = \'' + sessionUser.account + '\';\n        ';

        (0, _queryConductor.queryConductor)(connection, query).then(function (results) {
          res.json({ results: results });
          connection.release();
        });
      });
    }
  });
})
/**
 * @file /routes/users.js
 * @brief GET /user/check/id/?account API 계정이 이미 존재하는지 체크하는 API
 * @author 이장호
 * @date 2018-05-13
 */
.get('/check/id', function (req, res) {
  var account = req.query.account;


  _DBconfig.pool.getConnection(function (err, connection) {
    if (err) {
      var msg = "Error occurs while pool.getConnection in # GET /user/check/id/?account";

      console.log(err);
      console.log(msg);
      res.json({ err: err, msg: msg });
    } else {
      new Promise(function (resolve, reject) {
        var query = '\n        SELECT account\n          FROM user\n         WHERE account = \'' + account + '\'';

        (0, _queryConductor.queryConductor)(connection, query).then(function (results) {
          res.json({ results: results });
          connection.release();
        });
      });
    }
  });
})
/**
 * @file /routes/users.js
 * @brief GET /user/check/nickname/:nickname API 닉네임이 이미 존재하는지 체크하는 API
 * @author 이장호
 * @date 2018-05-14
 */
.get('/check/nickname', function (req, res) {
  var nickname = req.query.nickname;


  _DBconfig.pool.getConnection(function (err, connection) {
    if (err) {
      var msg = "Error occurs while pool.getConnection in # GET /user/check/nickname/?nickname";

      console.log(err);
      console.log(msg);
      res.json({ err: err, msg: msg });
    } else {
      new Promise(function (resolve, reject) {
        var query = '\n        SELECT account\n          FROM user\n         WHERE nickname = \'' + nickname + '\'';

        (0, _queryConductor.queryConductor)(connection, query).then(function (results) {
          res.json({ results: results });
          connection.release();
        });
      });
    }
  });
});

module.exports = router;

//# sourceMappingURL=user-compiled.js.map