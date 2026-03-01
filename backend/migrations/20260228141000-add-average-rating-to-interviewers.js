'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('interviewers', 'average_rating', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 4.8
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('interviewers', 'average_rating');
  }
};
