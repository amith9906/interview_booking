module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('students', 'is_active', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false
    });
    await queryInterface.addColumn('interviewers', 'is_active', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('students', 'is_active');
    await queryInterface.removeColumn('interviewers', 'is_active');
  }
};
