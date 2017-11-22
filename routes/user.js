import express from 'express';
import { pool } from './DBconfig';
import { queryConductor } from './queryConductor';
import bcrypt from 'bcrypt';

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
  let { session } = req;
  const { account } = req.body;
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
      SELECT name, nickname, password, divider, email
        FROM user
       WHERE account = "${account}"`;

      queryConductor(connection, query).then((results) => {
        if (results.length === 0) {
          const msg = "로그인 정보가 잘못되었습니다.";
          console.log(msg);
          connection.release();
          res.json({status: 404, msg});
        } else {
          const { name, nickname, password, divider, email } = results[0];

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
                  account,
                  name,
                  nickname,
                  divider,
                  email
                };

                session.account = account;
                session.name = name;
                session.nickname = nickname;
                session.divider = divider;
                session.email = email;

                connection.release();
                res.json({status: 200, user});
              } else {
                const msg = "로그인 정보가 잘못되었습니다.";
                console.log(msg);
                connection.release();
                res.json({status: 404, msg});
              }
            }
          })
        }
      }, error => {
        const msg = "Error occurs while SELECT user in # POST /user/login"
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
                    ${join_route}
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
  if (req.session.account) {
    res.json({result: true});
  } else {
    res.json({result: false});
  }
});

module.exports = router;