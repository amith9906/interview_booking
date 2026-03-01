'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('interviewers', {
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
      company_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'companies',
          key: 'id'
        },
        allowNull: false,
        onDelete: 'SET NULL'
      },
      availability_slots: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      skill_set: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      experience_years: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      bio: Sequelize.TEXT,
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
    await queryInterface.dropTable('interviewers');
  }
};
