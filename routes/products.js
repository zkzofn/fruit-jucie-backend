// var express = require('express');
// var pool = require('./DBconfig');

import express from 'express';
import { pool } from './DBconfig';

const router = express.Router();

router.get("/", (req, res, next) => {
  pool.getConnection((err, connection) => {
    const query = "SELECT * FROM product";

    // console.log(connection);

    connection.query(query, (error, products) => {

      // do something process
      console.log(products);

      res.json({products})


      connection.release();

      if(error) throw error
    })
  })
});

module.exports = router;