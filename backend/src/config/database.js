require("dotenv").config();
const { Sequelize } = require("sequelize");
const dns = require("dns");

dns.setDefaultResultOrder("ipv4first");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
 String(process.env.DB_PASSWORD),
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    define: {
      underscored: true
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
);

module.exports = sequelize;