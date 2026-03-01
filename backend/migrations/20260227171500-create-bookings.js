'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('bookings', {
      id: {
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'students',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      interviewer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'interviewers',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      slot_time: {
        type: Sequelize.DATE,
        allowNull: false
      },
      amount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('pending', 'paid', 'completed', 'cancelled'),
        defaultValue: 'pending'
      },
      stripe_session_id: Sequelize.STRING,
      notes: Sequelize.TEXT,
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
    await queryInterface.dropTable('bookings');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_bookings_status"');
  }
};
