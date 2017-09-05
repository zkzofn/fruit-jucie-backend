import express from 'express';
import { pool } from './DBconfig';

const router = express.Router();

router.get("/", (req, res, next) => {
  pool.getConnection((err, connection) => {
    const query = ""
    
    connection.query(query, (error, results) => {
      if(error) throw error
      
      // do something process
      
      connection.release();
    })
  })
});

module.exports = router;