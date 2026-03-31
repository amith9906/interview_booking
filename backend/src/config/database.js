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
      // Keep local development working for Postgres instances that don't have
      // SSL enabled by setting DB_SSL=true only when needed.
      ssl:
        process.env.DB_SSL === 'true' || process.env.DB_SSL === '1' || process.env.NODE_ENV === 'production'
          ? { require: true, rejectUnauthorized: false }
          : false
    }
  }
);

module.exports = sequelize;