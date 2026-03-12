'use strict';

module.exports = {
  async up(queryInterface) {
    // upsert companies by id to avoid deleting rows referenced by other tables
    await queryInterface.sequelize.query(`
      INSERT INTO companies (id, name, created_at, updated_at)
      VALUES
        (1, 'TechCorp', now(), now()),
        (2, 'Prodify Labs', now(), now())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = EXCLUDED.updated_at;
    `);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('companies', null, {});
  }
};
