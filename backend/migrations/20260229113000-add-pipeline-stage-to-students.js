'use strict';

const STAGES = ['shortlisted', 'interviewing', 'offered', 'rejected'];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('students');
    if (!tableInfo.pipeline_stage) {
      await queryInterface.addColumn('students', 'pipeline_stage', {
        type: Sequelize.ENUM(...STAGES),
        defaultValue: 'shortlisted',
        allowNull: false
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('students');
    if (tableInfo.pipeline_stage) {
      await queryInterface.removeColumn('students', 'pipeline_stage');
    }
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS \"enum_students_pipeline_stage\";');
  }
};
