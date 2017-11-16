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
 * 3. 일치하는 경우 session 정보 설정
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
  const { account, password } = req.body;


  pool.getConnection((error, connection) => {
    new Promise((resolve, reject) => {
      if (!(account && password)) {
        const msg = "Wrong request body in # POST /user/login"
        reject(msg);
      } else {
        resolve();
      }
    }).then(() => {
      // 사용자 있는지 먼저 체크
      const query = `
      SELECT name, nickname, password, divider, email
        FROM user
       WHERE account = "${account}"`;

      queryConductor(connection, query).then((results) => {
        if (results.length === 0) {
          const msg = "Wrong account information.";
          console.log(msg);
          connection.release();
          res.status(404).json({msg});
        } else {
          const passwordOriginal = password;
          const { name, nickname, password, divider, email } = results[0];

          bcrypt.compare(passwordOriginal, password, (error, result) => {
            if (error) {
              const msg = "Wrong account information."
              console.log(msg);
              connection.release();
              res.status(404).json({msg});
            } else {

            }
            if (result) {

            } else {
              const
            }
          })
        }
      })
    }).catch((error) => {
      console.log(error);
      connection.release();
      res.status(400).json({error});
    });

  });
}).get('/test', (req, res) => {
  let sess = req.session;

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
});

module.exports = router;