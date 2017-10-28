import express from 'express';
import { pool } from './DBconfig';
import { queryConductor } from './queryConductor';

const router = express.Router();

router.get("/", (req, res, next) => {
  pool.getConnection((err, connection) => {
    if (err) throw err;

    const query =
      `SELECT * 
         FROM address
        WHERE user_id = ${req.query.userId}`;

    queryConductor(connection, query)
      .then(results => {
        res.json({myAddressList: results});
        connection.release();
      })
  })
});

module.exports = router;