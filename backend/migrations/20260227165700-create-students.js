'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('students', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      skills: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      experience_years: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      education: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      projects: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      resume_file: Sequelize.STRING,
      ratings_avg: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now')
      }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('students');
  }
};
