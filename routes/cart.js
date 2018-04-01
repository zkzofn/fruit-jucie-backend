import express from 'express';
import { pool } from './DBconfig';
import { queryConductor } from './queryConductor';
import { getAuthUser } from './auth';

const router = express.Router();

router.get("/", (req, res) => {
  const sessionKey = req.headers.authorization;
  const sessionUser = getAuthUser(sessionKey);

  // select * 로 검색한 애들 전부다 필요한 것들만 select 걸러줘야 해
  pool.getConnection((err, connection) => {
    if (err) throw err;
    
    const userId = sessionUser.id;

    new Promise((resolve, reject) => {
      const query =
        `SELECT * 
           FROM cart_detail
          WHERE user_id = ${userId}
            AND status = 0`;

      queryConductor(connection, query)
        .then(cartProducts => {
          resolve({cartProducts});
        })
    }).then(({cartProducts}) => {
      const query =
        `SELECT product_id
           FROM cart_detail
          WHERE user_id = ${userId}
            AND status = 0
          GROUP BY product_id`;

      return queryConductor(connection, query)
        .then(distinctCartProducts => {
          return ({cartProducts, distinctCartProducts})
        })
    }).then(({cartProducts, distinctCartProducts}) => {
      const query =
        `SELECT B.* 
           FROM cart_detail A INNER JOIN product B
             ON A.product_id = B.id
          WHERE A.user_id = ${userId}
            AND status = 0
          GROUP BY B.id`;

      return queryConductor(connection, query)
        .then(products => {
          return ({cartProducts, distinctCartProducts, products})
        });
    }).then(({cartProducts, distinctCartProducts, products}) => {
      const query =
        `SELECT B.*
           FROM cart_detail A INNER JOIN product_option B
             ON A.product_option_id = B.id
          WHERE A.user_id = ${userId}
            AND status = 0
          GROUP BY B.id`;

      return queryConductor(connection, query)
        .then(productOptions => {
          return ({cartProducts, distinctCartProducts, products, productOptions})
        })
    }).then(({cartProducts, distinctCartProducts, products, productOptions}) => {
      return new Promise(resolve => {

        const cart = distinctCartProducts.map(distinctCartProduct => {
          distinctCartProduct["product"] = products.filter(product => {
            return product.id === distinctCartProduct.product_id;
          })[0];

          distinctCartProduct["product"]["count"] = cartProducts.filter(cartProduct => {
            return distinctCartProduct.product_id === cartProduct.product_id;
          })[0].count;

          distinctCartProduct["options"] = cartProducts.filter(cartProduct => {
            return distinctCartProduct.product_id === cartProduct.product_id && cartProduct.product_option_id !== null;
          }).map(cartProduct => {
            const cartId = cartProduct.id;
            const count = cartProduct.count;

            cartProduct = productOptions.filter(productOption => {
              return productOption.id === cartProduct.product_option_id;
            })[0];

            cartProduct["cartId"] = cartId;
            cartProduct["count"] = count;

            return cartProduct;
          });

          return distinctCartProduct;
        });

        resolve(cart);
      })
    }).then(cart => {
      res.json({cart});
      connection.release();
    })
  })
}).post("/", (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) throw err;

    const { userId, product, selectedOptions } = req.body;

    let productOptionCondition = "AND product_option_id in (";

    selectedOptions.forEach((selectedOption, index) => {
      productOptionCondition = `${productOptionCondition}${selectedOption.id}`;

      if (index === selectedOptions.length - 1) {
        productOptionCondition = `${productOptionCondition})`;
      } else {
        productOptionCondition = `${productOptionCondition},`;
      }
    });

    const query =
      `SELECT * 
         FROM cart_detail
        WHERE user_id = ${userId}
          AND product_id = ${product.id}
          ${selectedOptions.length > 0 ? productOptionCondition : ""}
          AND status = 0`;

    queryConductor(connection, query)
      .then(results => {
        if (selectedOptions.length === 0 && results.length === 0) {
          const query =
            `INSERT INTO cart_detail
                    (user_id, product_id, count, status, date)
             VALUES (${userId}, ${product.id}, ${product.count}, 0, now())`;

            queryConductor(connection, query)
              .then(insertResults => {

                // 이 부분은 아마 insertResults 값 없을거야 확인해보고 수정해
                res.json({insertResults});
                connection.release();
              })
        } else if (selectedOptions.length === 0 && results.length > 0) {
          const query =
            `UPDATE cart_detail
                SET count = count + ${product.count}
              WHERE id = ${results[0].id}`;

          queryConductor(connection, query)
            .then(updateResults => {
              // 이 부분은 아마 insertResults 값 없을거야 확인해보고 수정해
              res.json({updateResults});
              connection.release();
            })
        } else if (selectedOptions.length > 0) {
          new Promise(resolve => {
            for (let i = 0; i < selectedOptions.length; i++) {
              const lengthChecker = results.filter(result => {
                return result.product_option_id === selectedOptions[i].id
              });

              if (lengthChecker.length === 0) {
                const query =
                  `INSERT INTO cart_detail
                          (user_id, product_id, product_option_id, count, status, date)
                   VALUES (${userId}, ${product.id}, ${selectedOptions[i].id}, ${selectedOptions[i].count}, 0, now())`;

                queryConductor(connection, query)
              } else {
                const query =
                  `UPDATE cart_detail
                      SET count = count + ${selectedOptions[i].count}
                    WHERE id = ${lengthChecker[0].id}`;

                queryConductor(connection, query)
              }
            }
            resolve()
          }).then(() => {
            // 이 부분 어떻게 해야 좋을지 좀 생각해봐봐
            res.json({result: "success"});
            connection.release();
          });
        }
      })
  })
}).patch("/", (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) throw err;

    const { cartId, value } = req.body;
    const query =
      `UPDATE cart_detail
          SET count = count + ${value}
        WHERE id = ${cartId}`;

    queryConductor(connection, query)
      .then(() => {
        res.json({});
        connection.release();
      }).catch(err => {
        res.json({err});
        connection.release();
      })
  });
}).delete("/", (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) throw err;

    const { cartId } = req.body;
    const query =
      `UPDATE cart_detail
          SET status = 2
        WHERE id = ${cartId}`;

    queryConductor(connection, query)
      .then(() => {
        res.json({});
        connection.release();
      }).catch(err => {
        res.json({err});
        connection.release();
      });
  })
});

module.exports = router;