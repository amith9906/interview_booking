'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('courses', [
      { name: 'React End-to-End', level: 'Intermediate', duration_weeks: 4, description: 'Advanced React hooks and state management', created_at: new Date(), updated_at: new Date() },
      { name: 'Node.js Architecture', level: 'Advanced', duration_weeks: 5, description: 'API design, microservices, and testing', created_at: new Date(), updated_at: new Date() },
      { name: 'Data Structures & Algorithms', level: 'Foundation', duration_weeks: 4, description: 'Core DS&A patterns for interviews', created_at: new Date(), updated_at: new Date() }
    ]);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('courses', null, {});
  }
};
