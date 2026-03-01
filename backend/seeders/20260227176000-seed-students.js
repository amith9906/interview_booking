'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('students', [
      {
        user_id: 6,
        skills: ['React', 'Node.js', 'PostgreSQL'],
        experience_years: 1,
        education: JSON.stringify([{ degree: 'B.Tech Computer Science', year: 2023 }]),
        projects: JSON.stringify([{ title: 'AI Quiz', description: 'React + Node application' }]),
        resume_file: 'https://res.cloudinary.com/demo/r1.pdf',
        hobbies: ['Hackathons', 'Community clubs'],
        profile_status: 'approved',
        profile_submitted_at: now,
        created_at: now,
        updated_at: now
      },
      {
        user_id: 7,
        skills: ['TypeScript', 'React'],
        experience_years: 2,
        education: JSON.stringify([{ degree: 'B.Sc IT', year: 2022 }]),
        projects: JSON.stringify([{ title: 'Analytics Dashboard', description: 'Recharts + MUI' }]),
        resume_file: 'https://res.cloudinary.com/demo/r2.pdf',
        hobbies: ['Storytelling', 'Photography'],
        profile_status: 'approved',
        profile_submitted_at: now,
        created_at: now,
        updated_at: now
      },
      {
        user_id: 8,
        skills: ['Node.js', 'Express', 'MongoDB'],
        experience_years: 3,
        education: JSON.stringify([{ degree: 'BCA', year: 2021 }]),
        projects: JSON.stringify([{ title: 'Interview Scheduler API', description: 'Node + Sequelize' }]),
        resume_file: 'https://res.cloudinary.com/demo/r3.pdf',
        hobbies: ['Open source', 'Travel'],
        profile_status: 'approved',
        profile_submitted_at: now,
        created_at: now,
        updated_at: now
      },
      {
        user_id: 9,
        skills: ['React', 'TypeScript', 'Design'],
        experience_years: 2,
        education: JSON.stringify([{ degree: 'B.Des', year: 2020 }]),
        projects: JSON.stringify([{ title: 'Portfolio', description: 'Design system' }]),
        resume_file: 'https://res.cloudinary.com/demo/r4.pdf',
        hobbies: ['Design systems', 'Salsa dancing'],
        profile_status: 'approved',
        profile_submitted_at: now,
        created_at: now,
        updated_at: now
      },
      {
        user_id: 10,
        skills: ['PostgreSQL', 'Data Structures'],
        experience_years: 1,
        education: JSON.stringify([{ degree: 'B.Tech IT', year: 2024 }]),
        projects: JSON.stringify([{ title: 'Query Optimizer', description: 'SQL data modeling' }]),
        resume_file: 'https://res.cloudinary.com/demo/r5.pdf',
        hobbies: ['Data without borders', 'Running'],
        profile_status: 'approved',
        profile_submitted_at: now,
        created_at: now,
        updated_at: now
      }
    ]);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('students', null, {});
  }
};
