import express from 'express';
import { pool } from './DBconfig';
import { queryConductor } from './queryConductor';

const router = express.Router();

router.get("/check", (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      const msg = "Error occurs while pool.getConnection # GET /product/check";

      console.log(err);
      console.log(msg);
      res.json({err, msg});
    } else {
      const query = `
      SELECT id
        FROM product
       WHERE id = ${req.query.productId}
         AND unusable_flag IS NULL`;

      queryConductor(connection, query).then(results => {
        const productCheck = results.length > 0;
        connection.release();
        res.json({productCheck});
      })
    }
  })
})
.get("/", (req, res, next) => {
  pool.getConnection((err, connection) => {
    if (err) throw err;

    new Promise((resolve, reject) => {
      const query = `
      SELECT * 
        FROM product 
       WHERE id = ${req.query.productId}`;

      queryConductor(connection, query).then(results => {
        const product = results[0];

        resolve(product);
      });
    }).then((product) => {
      const query = `
      SELECT *
        FROM product_option
       WHERE product_id = ${req.query.productId}`;

      return queryConductor(connection, query).then(results => {
        product["options"] = results;

        return product;
      });
    }).then((product) => {
      const query = `
      SELECT * 
        FROM product_detail
       WHERE product_id = ${req.query.productId}`;

      return queryConductor(connection, query).then(results => {
        product["details"] = results;

        return product;
      })
    }).then((product) => {
      // 이거 페이지 기능 넣어서 쿼리 수정해야해
      const query = `
      SELECT *
        FROM post_script
       WHERE product_id = ${req.query.productId}`;

      queryConductor(connection, query).then(results => {
        product["post_script"] = results;

        res.json({product});
        connection.release();
      })
    });
  })
});

module.exports = router;