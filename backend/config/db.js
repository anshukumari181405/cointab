const mysql = require("mysql");

const database = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Akash123",
  database: "simple_website",
});

module.exports = database;
