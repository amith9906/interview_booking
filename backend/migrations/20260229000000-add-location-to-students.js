'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const info = await queryInterface.describeTable('students');
    if (!info.location) {
      await queryInterface.addColumn('students', 'location', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
  },

  async down(queryInterface) {
    const info = await queryInterface.describeTable('students');
    if (info.location) {
      await queryInterface.removeColumn('students', 'location');
    }
  }
};
