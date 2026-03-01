module.exports = (sequelize, DataTypes) => {
  const EmailVerification = sequelize.define('EmailVerification', {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    used: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    target_email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    purpose: {
      type: DataTypes.ENUM('initial', 'email_change'),
      defaultValue: 'initial'
    }
  }, {
    tableName: 'email_verifications',
    timestamps: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at'
  });

  EmailVerification.associate = (models) => {
    EmailVerification.belongsTo(models.User, { foreignKey: 'user_id' });
  };

  return EmailVerification;
};
