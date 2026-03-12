'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const info = await queryInterface.describeTable('interviews');
    const columns = [
      { name: 'interviewer_feedback_published', options: { type: Sequelize.BOOLEAN, defaultValue: false } },
      { name: 'interviewer_feedback_published_at', options: { type: Sequelize.DATE, allowNull: true } },
      { name: 'student_feedback_submitted', options: { type: Sequelize.BOOLEAN, defaultValue: false } },
      { name: 'student_feedback_submitted_at', options: { type: Sequelize.DATE, allowNull: true } },
      { name: 'student_skill_ratings', options: { type: Sequelize.JSONB, defaultValue: {} } },
      { name: 'student_comments', options: { type: Sequelize.TEXT, allowNull: true } },
      { name: 'student_overall_rating', options: { type: Sequelize.FLOAT, allowNull: true } }
    ];
    for (const column of columns) {
      if (!info[column.name]) {
        await queryInterface.addColumn('interviews', column.name, column.options);
      }
    }
  },

  async down(queryInterface) {
    const info = await queryInterface.describeTable('interviews');
    const columnNames = [
      'interviewer_feedback_published',
      'interviewer_feedback_published_at',
      'student_feedback_submitted',
      'student_feedback_submitted_at',
      'student_skill_ratings',
      'student_comments',
      'student_overall_rating'
    ];
    for (const column of columnNames) {
      if (info[column]) {
        await queryInterface.removeColumn('interviews', column);
      }
    }
  }
};
