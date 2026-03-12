module.exports = {
  up: async (queryInterface, Sequelize) => {
    const info = await queryInterface.describeTable('companies');
    if (!info.offers_internships) {
      await queryInterface.addColumn('companies', 'offers_internships', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }
  },
  down: async (queryInterface) => {
    const info = await queryInterface.describeTable('companies');
    if (info.offers_internships) {
      await queryInterface.removeColumn('companies', 'offers_internships');
    }
  }
};
