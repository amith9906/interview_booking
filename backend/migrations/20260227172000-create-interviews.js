'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('interviews', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      booking_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'bookings',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      skill_ratings: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      overall_rating: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      },
      feedback: Sequelize.TEXT,
      improve_areas: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
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
    await queryInterface.dropTable('interviews');
  }
};
