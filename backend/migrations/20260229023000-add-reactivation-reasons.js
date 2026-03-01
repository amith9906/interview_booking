'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await Promise.all([
      queryInterface.addColumn('students', 'activation_reason', {
        type: Sequelize.TEXT,
        allowNull: true
      }),
      queryInterface.addColumn('students', 'deactivation_reason', {
        type: Sequelize.TEXT,
        allowNull: true
      }),
      queryInterface.addColumn('interviewers', 'activation_reason', {
        type: Sequelize.TEXT,
        allowNull: true
      }),
      queryInterface.addColumn('interviewers', 'deactivation_reason', {
        type: Sequelize.TEXT,
        allowNull: true
      })
    ]);
  },

  async down(queryInterface) {
    await Promise.all([
      queryInterface.removeColumn('students', 'activation_reason'),
      queryInterface.removeColumn('students', 'deactivation_reason'),
      queryInterface.removeColumn('interviewers', 'activation_reason'),
      queryInterface.removeColumn('interviewers', 'deactivation_reason')
    ]);
  }
};
