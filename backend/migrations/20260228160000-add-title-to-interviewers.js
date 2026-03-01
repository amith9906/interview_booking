'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('interviewers', 'title', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'Interviewer'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('interviewers', 'title');
  }
};
