import express from 'express';
import { pool } from './DBconfig';

const router = express.Router();

router.get("/", (req, res, next) => {
  pool.getConnection((err, connection) => {
    if (err) throw err;

    const getQuery = (query) => {
      return new Promise((resolve, reject) => {
        connection.query(query, (error, results) => {
          if (error) reject(error);

          resolve(results);
        })
      })
    };

    new Promise((resolve, reject) => {
      const query =
        `SELECT * 
           FROM user 
          WHERE id = ${req.query.userId}`;

      return getQuery(query)
        .then(results => {
          const user = results[0];
          resolve(user);
        });
    }).then((user) => {
      // 사용자정보에서 민감정보는 뺴야한다.

      res.json({user});
      connection.release();
    })
  })
});

module.exports = router;