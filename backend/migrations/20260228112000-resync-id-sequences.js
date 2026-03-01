'use strict';

const tables = [
  'users',
  'students',
  'interviewers',
  'companies',
  'skills',
  'bookings',
  'interviews',
  'hr_users',
  'resumes',
  'courses',
  'student_courses',
  'notifications'
];

module.exports = {
  async up(queryInterface) {
    for (const table of tables) {
      await queryInterface.sequelize.query(
        `SELECT setval(pg_get_serial_sequence('${table}','id'), (COALESCE((SELECT MAX(id) FROM ${table}), 0) + 1), false)`
      );
    }
  },

  async down(queryInterface) {
    // no-op: sequences should continue incrementing normally
  }
};
