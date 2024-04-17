const mysql = require("mysql");

const database = mysql.createConnection({
  host: "sql6.freemysqlhosting.net",
  user: "sql6699839",
  password: "KexGRWVFZl",
  database: "sql6699839",
});

module.exports = database;
