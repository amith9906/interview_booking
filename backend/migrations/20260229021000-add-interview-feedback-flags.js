'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await Promise.all([
      queryInterface.addColumn('interviews', 'interviewer_feedback_published', {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      }),
      queryInterface.addColumn('interviews', 'interviewer_feedback_published_at', {
        type: Sequelize.DATE,
        allowNull: true
      }),
      queryInterface.addColumn('interviews', 'student_feedback_submitted', {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      }),
      queryInterface.addColumn('interviews', 'student_feedback_submitted_at', {
        type: Sequelize.DATE,
        allowNull: true
      }),
      queryInterface.addColumn('interviews', 'student_skill_ratings', {
        type: Sequelize.JSONB,
        defaultValue: {}
      }),
      queryInterface.addColumn('interviews', 'student_comments', {
        type: Sequelize.TEXT,
        allowNull: true
      }),
      queryInterface.addColumn('interviews', 'student_overall_rating', {
        type: Sequelize.FLOAT,
        allowNull: true
      })
    ]);
  },

  async down(queryInterface) {
    await Promise.all([
      queryInterface.removeColumn('interviews', 'interviewer_feedback_published'),
      queryInterface.removeColumn('interviews', 'interviewer_feedback_published_at'),
      queryInterface.removeColumn('interviews', 'student_feedback_submitted'),
      queryInterface.removeColumn('interviews', 'student_feedback_submitted_at'),
      queryInterface.removeColumn('interviews', 'student_skill_ratings'),
      queryInterface.removeColumn('interviews', 'student_comments'),
      queryInterface.removeColumn('interviews', 'student_overall_rating')
    ]);
  }
};
