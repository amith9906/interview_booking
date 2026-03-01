module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('courses', 'published', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('courses', 'published');
  }
};
