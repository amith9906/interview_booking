/* eslint-disable camelcase */
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('interviewers');
    if (!tableInfo.meeting_link) {
      await queryInterface.addColumn('interviewers', 'meeting_link', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
  },

  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable('interviewers');
    if (tableInfo.meeting_link) {
      await queryInterface.removeColumn('interviewers', 'meeting_link');
    }
  }
};
