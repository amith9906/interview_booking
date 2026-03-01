/* eslint-disable camelcase */
'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`ALTER TYPE "enum_bookings_status" ADD VALUE IF NOT EXISTS 'confirmed'`);
  },

  async down(queryInterface) {
    // PostgreSQL does not support removing enum values; skip
  }
};
