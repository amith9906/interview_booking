module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('interviewers', 'rate', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1000
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('interviewers', 'rate');
  }
};
