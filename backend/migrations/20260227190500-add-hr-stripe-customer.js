'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('hr_users');
    if (!tableInfo.stripe_customer_id) {
      await queryInterface.addColumn('hr_users', 'stripe_customer_id', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
  },
  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable('hr_users');
    if (tableInfo.stripe_customer_id) {
      await queryInterface.removeColumn('hr_users', 'stripe_customer_id');
    }
  }
};
