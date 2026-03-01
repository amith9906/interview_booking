'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('courses', 'instructor_name', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('courses', 'instructor_title', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('courses', 'instructor_email', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('courses', 'instructor_bio', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('courses', 'instructor_bio');
    await queryInterface.removeColumn('courses', 'instructor_email');
    await queryInterface.removeColumn('courses', 'instructor_title');
    await queryInterface.removeColumn('courses', 'instructor_name');
  }
};
