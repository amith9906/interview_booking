'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('students', 'hobbies', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      defaultValue: []
    });
    await queryInterface.addColumn('students', 'profile_status', {
      type: Sequelize.ENUM('draft', 'pending_review', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'draft'
    });
    await queryInterface.addColumn('students', 'profile_rejected_reason', {
      type: Sequelize.STRING
    });
    await queryInterface.addColumn('students', 'profile_submitted_at', {
      type: Sequelize.DATE
    });
    await queryInterface.addColumn('interviewers', 'projects', {
      type: Sequelize.JSONB,
      defaultValue: []
    });
    await queryInterface.addColumn('interviewers', 'hobbies', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      defaultValue: []
    });
    await queryInterface.addColumn('interviewers', 'profile_status', {
      type: Sequelize.ENUM('draft', 'pending_review', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'draft'
    });
    await queryInterface.addColumn('interviewers', 'profile_rejected_reason', {
      type: Sequelize.STRING
    });
    await queryInterface.addColumn('interviewers', 'profile_submitted_at', {
      type: Sequelize.DATE
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('interviewers', 'profile_submitted_at');
    await queryInterface.removeColumn('interviewers', 'profile_rejected_reason');
    await queryInterface.removeColumn('interviewers', 'profile_status');
    await queryInterface.removeColumn('interviewers', 'hobbies');
    await queryInterface.removeColumn('interviewers', 'projects');
    await queryInterface.removeColumn('students', 'profile_submitted_at');
    await queryInterface.removeColumn('students', 'profile_rejected_reason');
    await queryInterface.removeColumn('students', 'profile_status');
    await queryInterface.removeColumn('students', 'hobbies');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_interviewers_profile_status"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_students_profile_status"');
  }
};
