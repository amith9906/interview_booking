'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const info = await queryInterface.describeTable('users');
    if (!info.failed_login_attempts) {
      await queryInterface.addColumn('users', 'failed_login_attempts', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
    }
    if (!info.lockout_until) {
      await queryInterface.addColumn('users', 'lockout_until', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
    if (!info.is_active) {
      await queryInterface.addColumn('users', 'is_active', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      });
    }
  },

  async down(queryInterface) {
    const info = await queryInterface.describeTable('users');
    if (info.is_active) {
      await queryInterface.removeColumn('users', 'is_active');
    }
    if (info.lockout_until) {
      await queryInterface.removeColumn('users', 'lockout_until');
    }
    if (info.failed_login_attempts) {
      await queryInterface.removeColumn('users', 'failed_login_attempts');
    }
  }
};
