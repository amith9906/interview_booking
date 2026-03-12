'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const studentInfo = await queryInterface.describeTable('students');
    if (!studentInfo.hobbies) {
      await queryInterface.addColumn('students', 'hobbies', {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      });
    }
    if (!studentInfo.profile_status) {
      await queryInterface.addColumn('students', 'profile_status', {
        type: Sequelize.ENUM('draft', 'pending_review', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'draft'
      });
    }
    if (!studentInfo.profile_rejected_reason) {
      await queryInterface.addColumn('students', 'profile_rejected_reason', {
        type: Sequelize.STRING
      });
    }
    if (!studentInfo.profile_submitted_at) {
      await queryInterface.addColumn('students', 'profile_submitted_at', {
        type: Sequelize.DATE
      });
    }

    const interviewerInfo = await queryInterface.describeTable('interviewers');
    if (!interviewerInfo.projects) {
      await queryInterface.addColumn('interviewers', 'projects', {
        type: Sequelize.JSONB,
        defaultValue: []
      });
    }
    if (!interviewerInfo.hobbies) {
      await queryInterface.addColumn('interviewers', 'hobbies', {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      });
    }
    if (!interviewerInfo.profile_status) {
      await queryInterface.addColumn('interviewers', 'profile_status', {
        type: Sequelize.ENUM('draft', 'pending_review', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'draft'
      });
    }
    if (!interviewerInfo.profile_rejected_reason) {
      await queryInterface.addColumn('interviewers', 'profile_rejected_reason', {
        type: Sequelize.STRING
      });
    }
    if (!interviewerInfo.profile_submitted_at) {
      await queryInterface.addColumn('interviewers', 'profile_submitted_at', {
        type: Sequelize.DATE
      });
    }
  },

  async down(queryInterface) {
    const interviewerInfo = await queryInterface.describeTable('interviewers');
    if (interviewerInfo.profile_submitted_at) {
      await queryInterface.removeColumn('interviewers', 'profile_submitted_at');
    }
    if (interviewerInfo.profile_rejected_reason) {
      await queryInterface.removeColumn('interviewers', 'profile_rejected_reason');
    }
    if (interviewerInfo.profile_status) {
      await queryInterface.removeColumn('interviewers', 'profile_status');
    }
    if (interviewerInfo.hobbies) {
      await queryInterface.removeColumn('interviewers', 'hobbies');
    }
    if (interviewerInfo.projects) {
      await queryInterface.removeColumn('interviewers', 'projects');
    }
    const studentInfo = await queryInterface.describeTable('students');
    if (studentInfo.profile_submitted_at) {
      await queryInterface.removeColumn('students', 'profile_submitted_at');
    }
    if (studentInfo.profile_rejected_reason) {
      await queryInterface.removeColumn('students', 'profile_rejected_reason');
    }
    if (studentInfo.profile_status) {
      await queryInterface.removeColumn('students', 'profile_status');
    }
    if (studentInfo.hobbies) {
      await queryInterface.removeColumn('students', 'hobbies');
    }
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_interviewers_profile_status"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_students_profile_status"');
  }
};
