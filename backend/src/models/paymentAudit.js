module.exports = (sequelize, DataTypes) => {
  const PaymentAudit = sequelize.define(
    'PaymentAudit',
    {
      booking_id: DataTypes.INTEGER,
      student_id: DataTypes.INTEGER,
      amount: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      currency: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'inr'
      },
      payment_method: DataTypes.STRING,
      session_id: DataTypes.STRING,
      status: {
        type: DataTypes.ENUM('initiated', 'success', 'failure'),
        defaultValue: 'initiated'
      },
      message: DataTypes.TEXT,
      meta: {
        type: DataTypes.JSONB,
        defaultValue: {}
      }
    },
    {
      tableName: 'payment_audits',
      underscored: true
    }
  );

  PaymentAudit.associate = (models) => {
    PaymentAudit.belongsTo(models.Booking, { foreignKey: 'booking_id' });
    PaymentAudit.belongsTo(models.Student, { foreignKey: 'student_id' });
  };

  return PaymentAudit;
};
