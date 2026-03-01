'use strict';

module.exports = {
  async up(queryInterface) {
    // remove any existing rows for these skill names so the seeder is idempotent
    await queryInterface.sequelize.query(
      "DELETE FROM skills WHERE name IN ('React','Node.js','TypeScript','PostgreSQL','Data Structures')"
    );

    const now = new Date();
    await queryInterface.bulkInsert('skills', [
      { name: 'React', published: true, created_at: now, updated_at: now },
      { name: 'Node.js', published: true, created_at: now, updated_at: now },
      { name: 'TypeScript', published: true, created_at: now, updated_at: now },
      { name: 'PostgreSQL', published: true, created_at: now, updated_at: now },
      { name: 'Data Structures', published: true, created_at: now, updated_at: now }
    ]);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('skills', null, {});
  }
};
