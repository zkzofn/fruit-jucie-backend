import express from 'express';
import { pool } from './DBconfig';
import { queryConductor } from './queryConductor';

const router = express.Router();

router.get("/", (req, res, next) => {
  pool.getConnection((err, connection) => {
    if (err) throw err;

    const query = ``;

    queryConductor(connection, query)
      .then(results => {
        res.json({results});

        connection.release();
      })
  })
}).post("/", (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) throw err;

    const data = req.body;
    const orderKeys = Object.keys(data).filter(key => {
      return key !== "items"
    });
    const { items } = data;

    connection.beginTransaction(err => {
      if (err) throw err;

      new Promise((resolve, reject) => {
        let orderKeyString = "";
        let orderValueString = "";

        orderKeys.forEach((key) => {
          orderKeyString += key + ", ";

          // if (key === "user_id" || key === "status" || key === "total_price")
          //   orderValueString += `${data[key]}, `;
          // else
          //  // for string values
          orderValueString += `"${data[key]}", `;
        });

        orderKeyString += "date";
        orderValueString += "now()";

        // cart_detail 의 status 바꿔줘야해
        // order_detail에 cart_detail에 있는 내용들 넣어줘야해

        const query =
          `INSERT INTO \`order\`
                (${orderKeyString})
         VALUES (${orderValueString})`;

        queryConductor(connection, query)
          .then((results) => {
            resolve({results})
          }).catch(err => {
            connection.rollback(() => {
              throw err
            })
          })
      }).then(({results}) => {
        const orderId = results.insertId;

        const query =
          `INSERT INTO order_detail
                (order_id, product_id, product_option_id, count)
                SELECT "${orderId}", product_id, product_option_id, count
                  FORM cart_detail
                 WHERE user_id = ${data.user_id}
                   AND status = 0`;

        return queryConductor(connection, query)
          .catch(err => {
            connection.rollback(() => {
              throw err
            })
          })
      }).then(() => {
        const query =
          `UPDATE cart_detail
            SET status = 1
          WHERE user_id = ${data.user_id}
            AND status = 0`;

        return queryConductor(connection, query)
          .then(() => {
            connection.commit(err => {
              if (err)
                connection.rollback(() => {
                  throw err;
                })
            })
          }).catch(err => {
            connection.rollback(() => {
              throw err;
            })
          })
      }).then(() => {
        console.log("Post order success");
        connection.release();
      }).catch(err => {
        if (err) throw err;
        connection.release();
      });
    })
  })
});

module.exports = router;