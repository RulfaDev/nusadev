const mysql = require('mysql2/promise');
const config = require('../config');

const connection = mysql.createPool({
  host: config.database.host,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// connection.connect((err) => {
//   if (err) {
//     console.error('error connecting to the database:', err);
//   } else {
//     console.log('Connected to the MySQL database');
//   }
// });

module.exports = connection;
