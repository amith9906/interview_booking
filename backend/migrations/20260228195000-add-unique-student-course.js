'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.addConstraint('student_courses', {
      fields: ['student_id', 'course_id'],
      type: 'unique',
      name: 'student_courses_student_id_course_id_key'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint(
      'student_courses',
      'student_courses_student_id_course_id_key'
    );
  }
};
