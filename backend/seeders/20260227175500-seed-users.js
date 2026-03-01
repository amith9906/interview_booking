'use strict';
const bcrypt = require('bcrypt');
const now = new Date();

module.exports = {
  async up(queryInterface) {
    // delete any existing users with these ids or emails to avoid unique constraint violations
    await queryInterface.sequelize.query(
      "DELETE FROM users WHERE id IN (1,2,3,4,5,6,7,8,9,10) OR email IN ('admin@interview.com','hr@interview.com','alice@talent.com','bob@talent.com','clara@talent.com','student1@demo.com','student2@demo.com','student3@demo.com','student4@demo.com','student5@demo.com')"
    );

    await queryInterface.bulkInsert('users', [
      { id: 1, email: 'admin@interview.com', password_hash: bcrypt.hashSync('AdminPass!23', 10), role: 'admin', name: 'Super Admin', email_verified: true, created_at: now, updated_at: now },
      { id: 2, email: 'hr@interview.com', password_hash: bcrypt.hashSync('HrPass!23', 10), role: 'hr', name: 'HR Partner', email_verified: true, created_at: now, updated_at: now },
      { id: 3, email: 'alice@talent.com', password_hash: bcrypt.hashSync('IntPass!23', 10), role: 'interviewer', name: 'Alice Nguyen', email_verified: true, created_at: now, updated_at: now },
      { id: 4, email: 'bob@talent.com', password_hash: bcrypt.hashSync('IntPass!23', 10), role: 'interviewer', name: 'Bob Patel', email_verified: true, created_at: now, updated_at: now },
      { id: 5, email: 'clara@talent.com', password_hash: bcrypt.hashSync('IntPass!23', 10), role: 'interviewer', name: 'Clara Lee', email_verified: true, created_at: now, updated_at: now },
      { id: 6, email: 'student1@demo.com', password_hash: bcrypt.hashSync('StudPass!23', 10), role: 'student', name: 'Riya Sharma', email_verified: true, created_at: now, updated_at: now },
      { id: 7, email: 'student2@demo.com', password_hash: bcrypt.hashSync('StudPass!23', 10), role: 'student', name: 'Arjun Rao', email_verified: true, created_at: now, updated_at: now },
      { id: 8, email: 'student3@demo.com', password_hash: bcrypt.hashSync('StudPass!23', 10), role: 'student', name: 'Maya Singh', email_verified: true, created_at: now, updated_at: now },
      { id: 9, email: 'student4@demo.com', password_hash: bcrypt.hashSync('StudPass!23', 10), role: 'student', name: 'Dev Sekhar', email_verified: true, created_at: now, updated_at: now },
      { id: 10, email: 'student5@demo.com', password_hash: bcrypt.hashSync('StudPass!23', 10), role: 'student', name: 'Nisha Roy', email_verified: true, created_at: now, updated_at: now }
    ]);
    await queryInterface.sequelize.query(
      "SELECT setval(pg_get_serial_sequence('users','id'), (SELECT COALESCE(MAX(id), 0) FROM users))"
    );
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('users', null, {});
  }
};
