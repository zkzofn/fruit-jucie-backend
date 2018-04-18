import express from 'express';
import { pool } from './DBconfig';
import { queryConductor } from './queryConductor';
import { getAuthUser } from './auth';

const router = express.Router();

router.get("/user", (req, res, next) => {
  const sessionKey = req.headers.authorization;
  const sessionUser = getAuthUser(sessionKey);
  const userId = sessionUser.id;
  let endDate = req.query.endDate ? req.query.endDate : new Date();
  let startDate = req.query.startDate ? req.query.startDate : new Date();
  startDate.setMonth(startDate.getMonth() - 3);

  startDate = startDate.toISOString().slice(0, 10);
  endDate = endDate.toISOString().slice(0, 10);

  pool.getConnection(async (error, connection) => {
    if (error) {
      const msg = "Error occurs while pool.getConnection in # GET /order";
      console.log(error);
      console.log(msg);
      connection.release();
      res.status(500).json({error, msg});
    } else {
      await new Promise((resolve, reject) => {
        const query = `
        SELECT A.id as order_id, A.date, A.payment_type, A.total_price, B.product_id, B.product_option_id, B.count, B.days, B.mon, B.tue, B.wed, B.thur, B.fri
          FROM \`order\` A inner join order_detail B
            ON A.id = B.order_id
         WHERE A.user_id = ${userId}
           AND A.date > "${startDate}"
           AND A.date < "${endDate}"`;

        queryConductor(connection, query).then((results) => {
          resolve(results);
        }).catch(error => {
          const msg = "Error occurs while SELECT order info in # GET /order/user";
          reject({error, msg});
        })
      }).then((results) => {
        connection.release();
        res.json({results});
      }).catch(({error, msg}) => {
        console.log(error);
        console.log(msg);
        connection.release();
        res.status(500).json({error, msg});
      })
    }
  })
}).post("/", (req, res) => {
  const { orderInfo, fromCart, items } = req.body;
  const orderKeys = Object.keys(orderInfo);

  pool.getConnection((error, connection) => {
    if (error) {
      const msg = "Error occurs while pool.getConnection in # POST /order";
      console.log(error);
      console.log(msg);
      connection.release();
      res.status(500).json({error, msg});
    } else {
      connection.beginTransaction(async error => {
        if (error) {
          const msg = "Error occurs while beginTransaction in # POST /order";
          console.log(error);
          console.log(msg);
          connection.release();
          res.status(500).json({error,msg});
        } else {
          await new Promise((resolve, reject) => {
            let orderKeyString = "";
            let orderValueString = "";

            orderKeys.forEach((key) => {
              orderKeyString += key + ", ";
              orderValueString += `"${orderInfo[key]}", `;
            });

            orderKeyString += "date";
            orderValueString += "now()";

            const query = `
            INSERT INTO \`order\`
                   (${orderKeyString})
            VALUES (${orderValueString})`;

            queryConductor(connection, query).then(results => {
              resolve(results);
            }).catch(error => {
              const msg = "Error occurs while INSERT INTO order information in # POST /order";
              reject({error, msg});
            });
          }).then(results => {
            const orderId = results.insertId;
            const orderDetailValues = items.map(item => {
              const {product, options} = item;

              if (options.length === 0) {
                return `(
                  ${orderId},
                  ${product.id},
                  NULL,
                  ${product.count},
                  ${product.days},
                  ${product.daysCondition.mon},
                  ${product.daysCondition.tue},
                  ${product.daysCondition.wed},
                  ${product.daysCondition.thur},
                  ${product.daysCondition.fri}
                )`
              } else {
                return options.map(option => {
                  return `(
                    ${orderId},
                    ${product.id},
                    ${option.id},
                    ${option.count},
                    ${product.days},
                    ${product.daysCondition.mon},
                    ${product.daysCondition.tue},
                    ${product.daysCondition.wed},
                    ${product.daysCondition.thur},
                    ${product.daysCondition.fri}
                  )`;
                }).join(", ");
              }
            }).join(", ");

            const query = `
            INSERT INTO order_detail
                   (order_id, product_id, product_option_id, count, days, mon, tue, wed, thur, fri)
            VALUES ${orderDetailValues}`;

            return queryConductor(connection, query).catch(error => {
              const msg = "Error occurs while INSERT INTO order_detail information in # POST /order";
              throw {error, msg};
            })
          }).then(() => {
            if (fromCart) {
              const query = `
              UPDATE cart_detail
                 SET status = 1
               WHERE user_id = ${orderInfo.user_id}
                 AND status = 0`;

              return queryConductor(connection, query).catch(error => {
                const msg = "Error occurs while UPDATE cart_detail information in # POST /order";
                throw {error, msg};
              });
            }
          }).then(() => {
            connection.commit(error => {
              if (error) {
                const msg = "Error occurs while COMMIT in # POST /order";
                connection.release();
                res.status(500).json({error, msg});
              } else {
                connection.release();
                res.end();
              }
            })
          }).catch(({error, msg}) => {
            connection.rollback(() => {
              console.log(error);
              console.log(msg);
              connection.release();
              res.status(500).json({error, msg});
            });
          });
        }
      })
    }
  })
});

module.exports = router;