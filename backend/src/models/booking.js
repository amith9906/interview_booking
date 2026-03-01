module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define('Booking', {
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    interviewer_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    slot_time: {
      type: DataTypes.DATE,
      allowNull: false
    },
    amount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'in_progress', 'paid', 'completed', 'cancelled'),
      defaultValue: 'pending'
    },
    stripe_session_id: DataTypes.STRING,
    notes: DataTypes.TEXT
    ,
    acknowledged: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    acknowledged_at: DataTypes.DATE
  }, {
    tableName: 'bookings'
  });

  return Booking;
};
