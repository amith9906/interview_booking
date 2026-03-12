module.exports = {
  up: async (queryInterface, Sequelize) => {
    const info = await queryInterface.describeTable('interviewers');
    if (!info.rate) {
      await queryInterface.addColumn('interviewers', 'rate', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1000
      });
    }
  },
  down: async (queryInterface) => {
    const info = await queryInterface.describeTable('interviewers');
    if (info.rate) {
      await queryInterface.removeColumn('interviewers', 'rate');
    }
  }
};
