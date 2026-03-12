'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('interviewers');
    if (!tableInfo.average_rating) {
      await queryInterface.addColumn('interviewers', 'average_rating', {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 4.8
      });
    }
  },

  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable('interviewers');
    if (tableInfo.average_rating) {
      await queryInterface.removeColumn('interviewers', 'average_rating');
    }
  }
};
