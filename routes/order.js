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

    const orderQuery =
      `INSERT INTO \`order\`
              (${orderKeyString})
       VALUES (${orderValueString})`;

    queryConductor(connection, orderQuery)
      .then((results) => {

        const orderId = results.insertId;

        items.forEach(item => {
          let itemsKeyString = "";
          let itmesValueString = "";


          //////////////////////////////////////////////////////////////////////////////////////////////////
          // 여기에 query 넣는 부분 해야해

          const itmeQuery =
            `INSERT INTO order_detail
                    (
            `
        })

        res.json(results);
        connection.release();
      });
  })
});

module.exports = router;