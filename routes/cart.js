import express from 'express';
import { pool } from './DBconfig';
import { queryConductor } from './queryConductor';

const router = express.Router();

router.get("/", (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) throw err;
    const { userId } = req.query;

    new Promise((resolve, reject) => {
      const query =
        `SELECT * 
           FROM cart_detail
          WHERE user_id = ${userId}
            AND status = 0`;

      queryConductor(connection, query)
        .then(cartProducts => {
          resolve(cartProducts);
        })
    }).then((cartProducts) => {
      // const cart = cartProducts.map(cartProduct => {
      //   const query =
      //     `SELECT *
      //      FROM product
      //     WHERE id = ${cartProduct.product_id}`;
      //
      //   connection.query(query, (error, results) => {
      //     if (error) throw error;
      //
      //     cartProduct["product"] = results[0];
      //
      //     return cartProduct;
      //   });
      // });

      cartProducts.forEach((cartProduct, index, arr) => {
        const query =
            `SELECT *
               FROM product
              WHERE id = ${cartProduct.product_id}`;

          connection.query(query, (error, results) => {
            if (error) throw error;

            cartProduct["product"] = results[0];

            if (index == arr.length - 1) {
              return Promise.resolve(arr);
            }
          });
      })
    }).then(cart => {
      console.log(cart);
      res.json({cart});
      connection.release();
    })
  })
}).post("/", (req, res) => {
  pool.getConnection((err, connection) => {
    const { userId } = req.body;
    const { product } = req.body;
    const { selectedOptions } = req.body;

    if (selectedOptions.length === 0) {
      const query =
        `INSERT INTO cart_detail
                (user_id, product_id, count, status, date)
         VALUES (${userId}, ${product.id}, ${product.count}, 0, now())`;

      queryConductor(connection, query)
        .then(results => {

          res.json({results});
          connection.release();
        })
    } else {
      new Promise((resolve, reject) => {
        let resResults = [];

        for (let i = 0; i < selectedOptions.length; i++) {
          const query =
            `INSERT INTO cart_detail
                    (user_id, product_id, product_option_id, count, status, date)
             VALUES (${userId}, ${product.id}, ${selectedOptions[i].id}, ${selectedOptions[i].count}, 1, now())`;
          queryConductor(connection, query)
            .then(results => {
              resResults = [...resResults, results]
            })
            // .catch(error => {
            //   res.json({error});
            //   connection.release();
            // })
        }
        resolve(resResults)
      }).then(resResults => {
        res.json({resResults});
        connection.release();
      })
    }
  })
});

module.exports = router;