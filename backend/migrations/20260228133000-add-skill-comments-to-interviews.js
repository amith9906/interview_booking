'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('interviews', 'skill_comments', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('interviews', 'skill_comments');
  }
};
