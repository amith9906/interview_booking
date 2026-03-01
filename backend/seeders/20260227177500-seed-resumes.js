'use strict';

module.exports = {
  async up(queryInterface) {
    // make seeder idempotent and map resumes to actual student ids by user_id
    const userIds = [6,7,8,9,10];
    const files = [
      'https://res.cloudinary.com/demo/r1.pdf',
      'https://res.cloudinary.com/demo/r2.pdf',
      'https://res.cloudinary.com/demo/r3.pdf',
      'https://res.cloudinary.com/demo/r4.pdf',
      'https://res.cloudinary.com/demo/r5.pdf'
    ];

    // delete any existing resumes for these file paths to avoid duplicates
    await queryInterface.sequelize.query(
      "DELETE FROM resumes WHERE file_path IN ('https://res.cloudinary.com/demo/r1.pdf','https://res.cloudinary.com/demo/r2.pdf','https://res.cloudinary.com/demo/r3.pdf','https://res.cloudinary.com/demo/r4.pdf','https://res.cloudinary.com/demo/r5.pdf')"
    );

    const [students] = await queryInterface.sequelize.query(
      `SELECT id, user_id FROM students WHERE user_id IN (${userIds.join(',')})`
    );

    const userIdToStudentId = {};
    for (const s of students) userIdToStudentId[s.user_id] = s.id;

    const inserts = [];
    for (let i = 0; i < userIds.length; i++) {
      const uid = userIds[i];
      const sid = userIdToStudentId[uid];
      if (!sid) continue; // skip if student not present
      inserts.push({ student_id: sid, file_path: files[i], download_count: 0, created_at: new Date(), updated_at: new Date() });
    }

    if (inserts.length) await queryInterface.bulkInsert('resumes', inserts);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('resumes', null, {});
  }
};
