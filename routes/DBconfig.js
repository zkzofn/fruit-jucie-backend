import mysql from 'mysql';

export const pool = mysql.createPool({
  connectionLimit: 10,
  host: "eatmoregreen.cjttdb1qo9w9.ap-northeast-2.rds.amazonaws.com",
  user: "eatmoregreen",
  password: "dlwkdgh1!",
  database: "fruit"
});
