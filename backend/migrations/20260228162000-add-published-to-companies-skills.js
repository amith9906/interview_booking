'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const companyInfo = await queryInterface.describeTable('companies');
    if (!companyInfo.published) {
      await queryInterface.addColumn('companies', 'published', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }

    const skillInfo = await queryInterface.describeTable('skills');
    if (!skillInfo.published) {
      await queryInterface.addColumn('skills', 'published', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }
  },

  async down(queryInterface) {
    const companyInfo = await queryInterface.describeTable('companies');
    if (companyInfo.published) {
      await queryInterface.removeColumn('companies', 'published');
    }
    const skillInfo = await queryInterface.describeTable('skills');
    if (skillInfo.published) {
      await queryInterface.removeColumn('skills', 'published');
    }
  }
};
