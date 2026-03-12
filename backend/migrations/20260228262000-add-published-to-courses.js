module.exports = {
  up: async (queryInterface, Sequelize) => {
    const info = await queryInterface.describeTable('courses');
    if (!info.published) {
      await queryInterface.addColumn('courses', 'published', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      });
    }
  },
  down: async (queryInterface) => {
    const info = await queryInterface.describeTable('courses');
    if (info.published) {
      await queryInterface.removeColumn('courses', 'published');
    }
  }
};
