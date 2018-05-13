import express from 'express';
import { pool } from './DBconfig';
import { queryConductor } from './queryConductor';
import bcrypt from 'bcrypt';
import redis from 'redis';
import { secretToken, makeSessionKey, getAuthUser, sessionTimeout } from './auth';

const router = express.Router();

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
router.post("/login", (req, res) => {
  const { account } = req.body;
  const redisClient = redis.createClient();

  const passwordOriginal = req.body.password;

  pool.getConnection((error, connection) => {
    new Promise((resolve, reject) => {
      // 1. 입력 값이 모두 입력되었는지 확인
      if (!(account && passwordOriginal)) {
        const msg = "Wrong request body in # POST /user/login";
        reject(msg);
      } else {
        resolve();
      }
    }).then(() => {
      // 2. 아이디에 해당하는 비밀번호가 일치하는지 확인
      const query = `
      SELECT id, account, name, nickname, password, divider, email
        FROM user
       WHERE account = "${account}"`;

      queryConductor(connection, query).then((results) => {
        if (results.length === 0) {
          const msg = "로그인 정보가 잘못되었습니다.";
          console.log(msg);
          connection.release();
          res.json({user: null, msg});
        } else {
          const { id, account, name, nickname, password, divider, email } = results[0];

          // 3. 비밀번호가 일치하는 경우 session 정보 설정
          bcrypt.compare(passwordOriginal, password, (error, result) => {
            if (error) {
              const msg = "Error occurs while COMPARE PASSWORD in # POST /user/login";
              console.log(error);
              console.log(msg);
              connection.release();
              res.status(500).json({error, msg});
            } else {
              if (result) {
                const user = {
                  id,
                  account,
                  name,
                  nickname,
                  divider,
                  email
                };

                const userInfoString = JSON.stringify(user);
                const sessionKey = makeSessionKey(userInfoString);

                connection.release();

                redisClient.setex(sessionKey, sessionTimeout, userInfoString, (error) => {
                  redisClient.quit();
                  if (error) {
                    const msg = "Error occurs SET REDIS KEY in # POST /user/login";
                    console.log(error);
                    console.log(msg);
                    res.status(500).json({sessionKey: null, error, msg});
                  } else {
                    console.log(sessionKey);
                    res.json({sessionKey, user});
                  }
                });
              } else {
                const msg = "로그인 정보가 잘못되었습니다.";
                console.log(msg);
                connection.release();
                res.json({sessionKey: null, msg});
              }
            }
          })
        }
      }, error => {
        const msg = "Error occurs while SELECT user in # POST /user/login";
        console.log(error);
        console.log(msg);
        connection.release();
        res.status(500).json({error, msg});
      })
    }).catch((error) => {
      console.log(error);
      connection.release();
      res.status(400).json({error});
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

.get('/logout', (req, res) => {
  const { session } = req;

  if (session.account) {
    req.session.destroy(error => {
      if (error) {
        const msg = "Error occurs while DESTROYING SESSION in # GET /user/logout";
        console.log(error);
        console.log(msg);
        res.status(500).json({error, msg});
      } else {
        res.redirect("/")
      }
    })
  } else {
    res.redirect("/")
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
.post('/', (req, res) => {
  pool.getConnection((err, connection) => {
    const { account, name, nickname, phone, zipcode, address1, address2, email, join_route } = req.body;
    let { password } = req.body;

    new Promise((resolve, reject) => {
      if (!(account && password && name && nickname && phone && zipcode && address1 && address2 && email)) {
        const msg = "Wrong request body in # POST /user";
        reject(msg)
      } else {
        resolve();
      }
    }).then(() => {
      const query = `
      SELECT account
        FROM user
       WHERE account = "${account}"`;

      queryConductor(connection, query).then((results) => {
        if (results.length > 0) {
          const msg = "There is already account.";
          console.log(msg);
          connection.release();
          res.status(403).json({msg});
        } else {
          const saltRounds = 10;

          bcrypt.hash(password, saltRounds, (error, hash) => {
            if (error) {
              const msg = "Error occurs while CREATE HASH PASSWORD in # POST /user";
              console.log(error);
              console.log(msg);
              connection.release();
              res.status(500).json({error, msg});
            } else {
              password = hash;

              connection.beginTransaction(error => {
                if (error) {
                  const msg = "Error occurs while TRANSACTION in # POST /user";
                  console.log(error);
                  console.log(msg);
                  connection.release();
                  res.status(500).json({error, msg});
                } else {
                  // SHA1("test6")
                  // a66df261120b6c2311c6ef0b1bab4e583afcbcc0

                  const query = `
                  INSERT INTO user (
                    account,
                    name,
                    nickname,
                    password,
                    divider,
                    phone,
                    zipcode,
                    address1,
                    address2,
                    email,
                    enroll_date,
                    join_route
                  ) VALUES (
                    "${account}",
                    "${name}",
                    "${nickname}",
                    "${password}",
                    1,
                    "${phone}",
                    "${zipcode}",
                    "${address1}",
                    "${address2}",
                    "${email}",
                    now(),
                    0
                  )`;

                  console.log(password);

                  queryConductor(connection, query).then(() => {
                    connection.commit(error => {
                      if (error) {
                        const msg = "Error occurs while COMMIT in # POST /user";

                        console.log(error);
                        console.log(msg);
                        connection.rollback(() => {
                          connection.release();
                          res.status(500).json({error, msg});
                        })
                      } else {
                        let { session } = req;
                        session.account = account;
                        session.name = name;
                        session.nickname = nickname;
                        session.divider = 1;
                        session.email = email;

                        connection.release();
                        res.end();
                      }
                    })
                  }, error => {
                    const msg = "Error occurs while INSERT INTO user in # POST /user";

                    console.log(error);
                    console.log(msg);
                    connection.rollback(() => {
                      connection.release();
                      res.status(500).json({error, msg})
                    })
                  })
                }
              })
            }
          })
        }
      })
    }).catch((error) => {
      console.log(error);
      connection.release();
      res.status(400).json({error});
    });
  })
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
.get('/validate', (req, res) => {
  const redisClient = redis.createClient();
  const sessionKey = req.headers.authorization;

  redisClient.get(sessionKey, (error, reply) => {
    if (error) {
      const msg = "Error occurs while REDIS GET in # GET /user/validate";
      console.log(error);
      console.log(msg);
      redisClient.quit();
      res.status(500).json({error, msg});
    } else {
      if (reply) {
        redisClient.expire(sessionKey, 60 * 60, (error, reply) => {
          if (error) {
            const msg = "Error occurs while REDIS EXPIREAT in #GET /user/validate";
            console.log(error);
            console.log(msg);
            redisClient.quit();
            res.status(500).json({error, msg});
          } else {
            redisClient.quit();
            res.json({validate: true});
          }
        });
      } else {
        res.json({validate: false});
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
.get('/', (req, res) => {
  const sessionKey = req.headers.authorization;
  const sessionUser = getAuthUser(sessionKey);

  pool.getConnection((err, connection) => {
    if (err) {
      const msg = "Error occurs while pool.getConnection in # GET /user";

      console.log(err);
      console.log(msg);
      res.json({err, msg});
    } else {
      new Promise((resolve, reject) => {
        const query = `
        SELECT id, account, name, nickname, phone, address1, address2, email, zipcode
          FROM user
         WHERE account = '${sessionUser.account}';
        `;

        queryConductor(connection, query).then(results => {
          const user = results[0];
          
          res.json({user});
          connection.release();
        });
      })
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
.patch('/', (req, res) => {
  const sessionKey = req.headers.authorization;
  const sessionUser = getAuthUser(sessionKey);

  const { nickname, password, phone, zipcode, address1, address2 } = req.body;

  pool.getConnection((err, connection) => {
    if (err) {
      const msg = "Error occurs while pool.getConnection in # PATCH /user/userId";

      console.log(err);
      console.log(msg);
      res.json({err, msg});
    } else {
      new Promise((resolve, reject) => {
        const query = `
        UPDATE user
           SET nickname = '${nickname}',
               password = '${password}',
               phone = '${phone}',
               zipcode = '${zipcode}',
               address1 = '${address1}',
               address2 = '${address2}'
         WHERE account = '${sessionUser.account}';
        `;

        queryConductor(connection, query).then(results => {
          res.json({results});
          connection.release();
        })
      })
    }
  })
})
/**
 * @file /routes/users.js
 * @brief GET /user/check/id/:account API 계정이 이미 존재하는지 체크하는 API
 * @author 이장호
 * @date 2018-05-13
 */
.get('/check/id', (req, res) => {
  const { account } = req.params;

  pool.getConnection((err, connection) => {
    if (err) {
      const msg = "Error occurs while pool.getConnection in # GET /user/check/id/:account";

      console.log(err);
      console.log(msg);
      res.json({err, msg});
    } else {
      new Promise((resolve, reject) => {
        const query = `
        SELECT account
          FROM user
         WHERE account = '${account}'`;

        queryConductor(connection, query).then(results => {
          console.log(results);
          res.json({results});
          connection.release();
        })
      })
    }
  })
})
;

module.exports = router;