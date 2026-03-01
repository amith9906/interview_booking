module.exports = (sequelize, DataTypes) => {
  const HrUser = sequelize.define('HrUser', {
    user_id: {
      type: DataTypes.INTEGER,
      unique: true
    },
    subscription_points: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    plan_expiry: DataTypes.DATE,
    subscription_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    stripe_customer_id: DataTypes.STRING
    ,
    students_visible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'hr_users'
  });

  return HrUser;
};
