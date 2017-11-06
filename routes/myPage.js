import express from 'express';
import { pool } from './DBconfig';
import { queryConductor } from './queryConductor';

const router = express.Router();

router.get("/order", (req, res, next) => {
  try {
    pool.getConnection((err, connection) => {
      if (err) throw err;
      const { userId } = req.query;

      const query =
        `SELECT *
         FROM \`order\`
        WHERE user_id = ${userId}`;

      queryConductor(connection, query)
        .then(orders => {
          let orderIdString = "";

          orders.forEach((order, index, array) => {
            orderIdString += index === (array.length - 1) ? order.id : `${order.id}, `;
          });

          const query =
            `SELECT *
             FROM order_detail
            WHERE order_id in (${orderIdString})`;

          queryConductor(connection, query)
            .then(order_details => {
              // order_detail의 product_id / product_option_id 별로 product, product_option에서
              // 정보 가져와서 json만들어서 response해야해


              orders.forEach(order => {
                order.order_details = order_details.filter(order_detail => {
                  return order.id === order_detail.order_id;
                })
              });

              res.json({orders});
              connection.release();
            }, err => {
              console.log("Error occurs while SELECT FROM order_detail in getMyPageOrder");
              connection.release();
              throw err;
            });
        }, err => {
          console.log("Error occurs while SELECT FROM order in getMyPageOrder");
          connection.release();
          throw err;
        })
    })
  } catch(err) {
    res.json({err});
  }
});

module.exports = router;