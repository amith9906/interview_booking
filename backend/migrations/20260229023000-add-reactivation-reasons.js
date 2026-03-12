'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const studentInfo = await queryInterface.describeTable('students');
    if (!studentInfo.activation_reason) {
      await queryInterface.addColumn('students', 'activation_reason', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }
    if (!studentInfo.deactivation_reason) {
      await queryInterface.addColumn('students', 'deactivation_reason', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }
    const interviewerInfo = await queryInterface.describeTable('interviewers');
    if (!interviewerInfo.activation_reason) {
      await queryInterface.addColumn('interviewers', 'activation_reason', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }
    if (!interviewerInfo.deactivation_reason) {
      await queryInterface.addColumn('interviewers', 'deactivation_reason', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }
  },

  async down(queryInterface) {
    const studentInfo = await queryInterface.describeTable('students');
    if (studentInfo.activation_reason) {
      await queryInterface.removeColumn('students', 'activation_reason');
    }
    if (studentInfo.deactivation_reason) {
      await queryInterface.removeColumn('students', 'deactivation_reason');
    }
    const interviewerInfo = await queryInterface.describeTable('interviewers');
    if (interviewerInfo.activation_reason) {
      await queryInterface.removeColumn('interviewers', 'activation_reason');
    }
    if (interviewerInfo.deactivation_reason) {
      await queryInterface.removeColumn('interviewers', 'deactivation_reason');
    }
  }
};
