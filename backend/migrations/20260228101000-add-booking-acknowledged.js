/* eslint-disable camelcase */
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('bookings');
    if (!tableInfo.acknowledged) {
      await queryInterface.addColumn('bookings', 'acknowledged', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      });
    }
    if (!tableInfo.acknowledged_at) {
      await queryInterface.addColumn('bookings', 'acknowledged_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
  },

  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable('bookings');
    if (tableInfo.acknowledged) {
      await queryInterface.removeColumn('bookings', 'acknowledged');
    }
    if (tableInfo.acknowledged_at) {
      await queryInterface.removeColumn('bookings', 'acknowledged_at');
    }
  }
};
