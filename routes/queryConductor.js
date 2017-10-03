export const queryConductor = (connection, query) => {
  return new Promise((resolve, reject) => {
    connection.query(query, (error, results) => {
      if (error) reject(error);

      resolve(results);
    })
  })
};