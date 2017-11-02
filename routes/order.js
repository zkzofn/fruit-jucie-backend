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
  try {
    pool.getConnection((err, connection) => {
      if (err) throw err;

      const data = req.body;
      const orderKeys = Object.keys(data).filter(key => {
        return key !== "items"
      });

      connection.beginTransaction(err => {
        if (err) throw err;

        new Promise((resolve, reject) => {
          let orderKeyString = "";
          let orderValueString = "";

          orderKeys.forEach((key) => {
            orderKeyString += key + ", ";
            orderValueString += `"${data[key]}", `;
          });

          orderKeyString += "date";
          orderValueString += "now()";

          const query =
            `INSERT INTO \`order\`
                    (${orderKeyString})
             VALUES (${orderValueString})`;

          queryConductor(connection, query)
            .then(results => {
              const orderId = results.insertId;
              const query =
                `INSERT INTO order_detail
                      (order_id, product_id, product_option_id, count)
                      SELECT ${orderId}, product_id, product_option_id, count
                        FROM cart_detail
                       WHERE user_id = ${data.user_id}
                         AND status = 0`;

              queryConductor(connection, query)
                .then(() => {
                  const query =
                    `UPDATE cart_detail
                        SET status = 1
                      WHERE user_id = ${data.user_id}
                        AND status = 0`;

                  queryConductor(connection, query)
                    .then(() => {
                      connection.commit(err => {
                        if (err) {
                          console.log("error 4")
                          connection.rollback(() => {
                            throw err;
                          })
                        }
                        console.log(`user id = ${data.user_id} postOrder success`);
                        connection.release();
                      })
                    }, err => {
                      console.log("Error occurs while UPDATE cart_detail information in postOrder.");
                      connection.rollback(() => {
                        throw err;
                      })
                    })
                }, err => {
                  console.log("Error occurs while INSERT INTO order_detail information in postOrder.");
                  connection.rollback(() => {
                    throw err
                  })
                })
            }, err => {
              console.log("Error occurs while INSERT INTO order information in postOrder.");
              connection.rollback(() => {
                throw err
              })
            })
        })
      })
    })
  } catch (err) {
    console.log(err);
    throw err;
  } finally {
    res.json({});
    connection.release();
  }
});

module.exports = router;