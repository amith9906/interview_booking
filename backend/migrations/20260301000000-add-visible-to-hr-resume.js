'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const info = await queryInterface.describeTable('resumes');
    if (!info.visible_to_hr) {
      await queryInterface.addColumn('resumes', 'visible_to_hr', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }
  },

  down: async (queryInterface) => {
    const info = await queryInterface.describeTable('resumes');
    if (info.visible_to_hr) {
      await queryInterface.removeColumn('resumes', 'visible_to_hr');
    }
  }
};
