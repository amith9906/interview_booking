'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query("ALTER TYPE \"enum_bookings_status\" ADD VALUE IF NOT EXISTS 'postponed';");
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_bookings_status') THEN
          ALTER TYPE "enum_bookings_status" RENAME TO "enum_bookings_status_old";
          CREATE TYPE "enum_bookings_status" AS ENUM ('pending','paid','completed','cancelled','confirmed','in_progress');
          ALTER TABLE "bookings" ALTER COLUMN "status" TYPE "enum_bookings_status" USING "status"::text::"enum_bookings_status";
          DROP TYPE "enum_bookings_status_old";
        END IF;
      END
      $$;
    `);
  }
};
