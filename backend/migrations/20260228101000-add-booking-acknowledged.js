/* eslint-disable camelcase */
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('bookings', 'acknowledged', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });
    await queryInterface.addColumn('bookings', 'acknowledged_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('bookings', 'acknowledged');
    await queryInterface.removeColumn('bookings', 'acknowledged_at');
  }
};
