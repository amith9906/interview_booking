module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payment_audits', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      booking_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'bookings', key: 'id' },
        onDelete: 'SET NULL'
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'students', key: 'id' },
        onDelete: 'SET NULL'
      },
      amount: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'inr'
      },
      payment_method: {
        type: Sequelize.STRING,
        allowNull: true
      },
      session_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('initiated', 'success', 'failure'),
        allowNull: false,
        defaultValue: 'initiated'
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      meta: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('payment_audits');
  }
};
