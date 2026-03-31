require('dotenv').config();

// When connecting to local Postgres (often without SSL), Sequelize will fail if we
// force SSL. Control this via DB_SSL=true/false.
const useSslInDevelopment = process.env.DB_SSL === 'true' || process.env.DB_SSL === '1';
const useSslInProduction = process.env.DB_SSL !== 'false';

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: useSslInDevelopment
        ? { require: true, rejectUnauthorized: false }
        : false
    }
  },

  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres'
  },

  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: useSslInProduction
        ? { require: true, rejectUnauthorized: false }
        : false
    }
  }
};