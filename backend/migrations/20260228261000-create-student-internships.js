module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('student_internships', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'students', key: 'id' },
        onDelete: 'CASCADE'
      },
      internship_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'internships', key: 'id' },
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('registered', 'in_review', 'matched', 'started', 'completed', 'withdrawn'),
        allowNull: false,
        defaultValue: 'registered'
      },
      desired_skills: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      purpose: Sequelize.TEXT,
      duration_months: Sequelize.INTEGER,
      start_date: Sequelize.DATE,
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });
    await queryInterface.addConstraint('student_internships', {
      fields: ['student_id', 'internship_id'],
      type: 'unique',
      name: 'student_internship_unique'
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('student_internships');
  }
};
