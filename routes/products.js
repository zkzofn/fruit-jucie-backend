// var express = require('express');
// var pool = require('./DBconfig');

import express from 'express';
import { pool } from './DBconfig';

var router = express.Router();

router.get("/", (req, res, next) => {
  pool.getConnection((err, connection) => {
    const queryq = "SELECT * " +
                  "  FROM product";

    console.log(connection);

    connection.query(queryq, (error, results, fields) => {
      // do something process
      console.log(results);
      console.log(fields);
      
      connection.release();

      if(error) throw error
    })
  })
});

module.exports = router;