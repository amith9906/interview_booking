'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('hr_transactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      hr_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'hr_users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM('credit_add', 'download', 'subscription'),
        allowNull: false
      },
      credits_change: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      description: {
        type: Sequelize.TEXT
      },
      resume_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'resumes',
          key: 'id'
        },
        onDelete: 'SET NULL'
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
    await queryInterface.dropTable('hr_transactions');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_hr_transactions_type"');
  }
};
