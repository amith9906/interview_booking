'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('interviews');
    if (!tableInfo.skill_comments) {
      await queryInterface.addColumn('interviews', 'skill_comments', {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      });
    }
  },

  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable('interviews');
    if (tableInfo.skill_comments) {
      await queryInterface.removeColumn('interviews', 'skill_comments');
    }
  }
};
