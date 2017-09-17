import express from 'express';
import { pool } from './DBconfig';

const router = express.Router();

router.get("/", (req, res, next) => {
  pool.getConnection((err, connection) => {
    const query = "SELECT * FROM product";

    connection.query(query, (error, products) => {
      if(error) throw error

      // do something process
      res.json({products});

      connection.release();

    })
  })
});

module.exports = router;