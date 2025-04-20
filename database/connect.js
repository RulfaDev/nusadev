const mysql = require('mysql2');
const config = require('../config');

const connection = mysql.createConnection({
  host: config.database.host,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
});

connection.connect((err) => {
  if (err) {
    console.error('error connecting to the database:', err);
  } else {
    console.log('Connected to the MySQL database');
  }
});

module.exports = connection;
