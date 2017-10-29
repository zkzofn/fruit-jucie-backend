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
    const keys = Object.keys(data);

    let keyString = "";
    let valueString = "";

    keys.forEach((key) => {
      keyString += key + ", ";

      if (key === "user_id" || key === "status" || key === "total_price")
        valueString += `${data[key]}, `;
      else
        valueString += `"${data[key]}", `;
    });

    keyString += "date";
    valueString += "now()";


    // cart_detail 의 status 바꿔줘야해
    // order_detail에 cart_detail에 있는 내용들 넣어줘야해

    const query =
      `INSERT INTO \`order\`
              (${keyString})
       VALUES (${valueString})`;

    console.log(query);

    queryConductor(connection, query)
      .then((results) => {
        res.json(results);
        connection.release();
      });
  })
});

module.exports = router;