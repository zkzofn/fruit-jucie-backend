var express = require('express');
import { pool } from './DBconfig';

export const router = express.Router();

router.get("/", (req, res, next) => {
  pool.getConnection((err, connection) => {
    const query = ""
    
    connection.query(query, (error, results, fields) => {
      // do something process
      
      connection.release();

      if(error) throw error
    })
  })
});

