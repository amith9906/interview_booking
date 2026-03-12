'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('interviewers');
    if (!tableInfo.title) {
      await queryInterface.addColumn('interviewers', 'title', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Interviewer'
      });
    }
  },

  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable('interviewers');
    if (tableInfo.title) {
      await queryInterface.removeColumn('interviewers', 'title');
    }
  }
};
