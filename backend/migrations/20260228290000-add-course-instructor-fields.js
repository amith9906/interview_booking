'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('courses');
    if (!tableInfo.instructor_name) {
      await queryInterface.addColumn('courses', 'instructor_name', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    if (!tableInfo.instructor_title) {
      await queryInterface.addColumn('courses', 'instructor_title', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    if (!tableInfo.instructor_email) {
      await queryInterface.addColumn('courses', 'instructor_email', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    if (!tableInfo.instructor_bio) {
      await queryInterface.addColumn('courses', 'instructor_bio', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }
  },

  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable('courses');
    if (tableInfo.instructor_bio) {
      await queryInterface.removeColumn('courses', 'instructor_bio');
    }
    if (tableInfo.instructor_email) {
      await queryInterface.removeColumn('courses', 'instructor_email');
    }
    if (tableInfo.instructor_title) {
      await queryInterface.removeColumn('courses', 'instructor_title');
    }
    if (tableInfo.instructor_name) {
      await queryInterface.removeColumn('courses', 'instructor_name');
    }
  }
};
