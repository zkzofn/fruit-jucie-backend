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
             FROM product 
            WHERE id = ${req.query.productId}`;

      getQuery(query)
        .then(results => {
          const product = results[0];

          resolve(product);
        });
    }).then((product) => {
      const query =
        `SELECT *
           FROM product_option
          WHERE product_id = ${req.query.productId}`;

      return getQuery(query)
        .then(results => {
          product["options"] = results;

          return product;
        });
    }).then((product) => {
      const query =
        `SELECT * 
           FROM product_detail
          WHERE product_id = ${req.query.productId}`;

      return getQuery(query)
        .then(results => {
          product["details"] = results;

          return product;
        })
    }).then((product) => {
      // 이거 페이지 기능 넣어서 쿼리 수정해야해
      const query = 
        `SELECT *
           FROM post_script
          WHERE product_id = ${req.query.productId}`;

      getQuery(query)
        .then(results => {
          product["post_script"] = results;

          res.json({product});
          connection.release();
        })
    });
  })
});

module.exports = router;