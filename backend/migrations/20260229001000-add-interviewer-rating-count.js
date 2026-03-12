'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const info = await queryInterface.describeTable('interviewers');
    if (!info.rating_count) {
      await queryInterface.addColumn('interviewers', 'rating_count', {
        type: Sequelize.INTEGER,
        defaultValue: 0
      });
    }
  },

  async down(queryInterface) {
    const info = await queryInterface.describeTable('interviewers');
    if (info.rating_count) {
      await queryInterface.removeColumn('interviewers', 'rating_count');
    }
  }
};
