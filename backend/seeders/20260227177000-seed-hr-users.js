'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('hr_users', [
      {
        user_id: 2,
        subscription_points: 50,
        plan_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subscription_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('hr_users', null, {});
  }
};
