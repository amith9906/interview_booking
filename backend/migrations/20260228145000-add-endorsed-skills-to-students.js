'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('students');
    if (!tableInfo.endorsed_skills) {
      await queryInterface.addColumn('students', 'endorsed_skills', {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: []
      });
    }
  },

  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable('students');
    if (tableInfo.endorsed_skills) {
      await queryInterface.removeColumn('students', 'endorsed_skills');
    }
  }
};
