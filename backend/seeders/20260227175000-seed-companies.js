'use strict';

module.exports = {
  async up(queryInterface) {
    // upsert companies by id to avoid deleting rows referenced by other tables
    await queryInterface.sequelize.query(`
      INSERT INTO companies (id, name, published, created_at, updated_at)
      VALUES
        (1, 'TechCorp', true, now(), now()),
        (2, 'Prodify Labs', true, now(), now())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        published = EXCLUDED.published,
        updated_at = EXCLUDED.updated_at;
    `);
    await queryInterface.sequelize.query(
      "SELECT setval(pg_get_serial_sequence('companies','id'), (SELECT COALESCE(MAX(id), 0) FROM companies))"
    );
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('companies', null, {});
  }
};
