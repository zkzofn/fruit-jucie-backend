import express from 'express';
import { pool } from './DBconfig';
import { queryConductor } from './queryConductor';
import { getAuthUser } from './auth';

const router = express.Router();

/**
 * @file /routes/address.js
 * @brief GET address API
 * @author 이장호
 * @date 2018-03-27
 *
 * @sequence
 * 1. 사용자가 등록한 주소 목록을 return
 *
 * @return addressList<Object>
 */
router.get("/", (req, res, next) => {
  const sessionKey = req.headers.authorization;
  const sessionUser = getAuthUser(sessionKey);

  pool.getConnection((err, connection) => {
    if (err) {
      console.log(err);
      res.json({err});
    } else {
      const query = `
      SELECT A.id, A.user_id, A.address1, A.address2, A.zipcode
        FROM address AS A INNER JOIN user AS B
          ON A.user_id = B.id
       WHERE B.account = '${sessionUser.account}'
      `;

      queryConductor(connection, query).then(addressList => {
        res.json({addressList});
        connection.release();
      })
    }
  })
});

module.exports = router;