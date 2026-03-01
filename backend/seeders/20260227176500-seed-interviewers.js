'use strict';

module.exports = {
  async up(queryInterface) {
    // remove existing rows for these interviewers to make seeder idempotent
    await queryInterface.sequelize.query(
      "DELETE FROM interviewers WHERE user_id IN (3,4,5)"
    );
    const now = new Date();

    await queryInterface.bulkInsert('interviewers', [
      {
        user_id: 3,
        company_id: 1,
        title: 'Full-stack Interviewer',
        availability_slots: JSON.stringify([{ date: '2026-03-01', time_slots: ['10:00', '11:00'] }]),
        skill_set: ['React', 'Node.js'],
        experience_years: 5,
        bio: 'Full-stack engineer',
        projects: JSON.stringify([{ title: 'Platform Metrics', description: 'React + Express' }]),
        hobbies: ['Gardening', 'Open source'],
        profile_status: 'approved',
        profile_submitted_at: now,
        created_at: now,
        updated_at: now
      },
      {
        user_id: 4,
        company_id: 1,
        title: 'Design Systems Lead',
        availability_slots: JSON.stringify([{ date: '2026-03-02', time_slots: ['12:00', '13:00'] }]),
        skill_set: ['TypeScript', 'Design'],
        experience_years: 7,
        bio: 'Design-focused technical lead',
        projects: JSON.stringify([{ title: 'Design Ops', description: 'Design system + TS tooling' }]),
        hobbies: ['Photography', 'Travel'],
        profile_status: 'approved',
        profile_submitted_at: now,
        created_at: now,
        updated_at: now
      },
      {
        user_id: 5,
        company_id: 2,
        title: 'Data Architecture Coach',
        availability_slots: JSON.stringify([{ date: '2026-03-03', time_slots: ['14:00', '15:00'] }]),
        skill_set: ['PostgreSQL', 'Data Structures'],
        experience_years: 6,
        bio: 'Database architect',
        projects: JSON.stringify([{ title: 'Query Accelerator', description: 'Postgres tuning' }]),
        hobbies: ['Cooking', 'Strategy games'],
        profile_status: 'approved',
        profile_submitted_at: now,
        created_at: now,
        updated_at: now
      }
    ]);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('interviewers', null, {});
  }
};
