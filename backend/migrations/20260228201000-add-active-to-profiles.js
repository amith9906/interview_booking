module.exports = {
  up: async (queryInterface, Sequelize) => {
    const studentInfo = await queryInterface.describeTable('students');
    if (!studentInfo.is_active) {
      await queryInterface.addColumn('students', 'is_active', {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      });
    }
    const interviewerInfo = await queryInterface.describeTable('interviewers');
    if (!interviewerInfo.is_active) {
      await queryInterface.addColumn('interviewers', 'is_active', {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      });
    }
  },
  down: async (queryInterface) => {
    const studentInfo = await queryInterface.describeTable('students');
    if (studentInfo.is_active) {
      await queryInterface.removeColumn('students', 'is_active');
    }
    const interviewerInfo = await queryInterface.describeTable('interviewers');
    if (interviewerInfo.is_active) {
      await queryInterface.removeColumn('interviewers', 'is_active');
    }
  }
};
