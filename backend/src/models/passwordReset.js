module.exports = (sequelize, DataTypes) => {
  const PasswordReset = sequelize.define(
    'PasswordReset',
    {
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
      }
    },
    {
      tableName: 'password_resets',
      timestamps: true,
      updatedAt: 'updated_at',
      createdAt: 'created_at'
    }
  );

  PasswordReset.associate = (models) => {
    PasswordReset.belongsTo(models.User, { foreignKey: 'user_id', as: 'User' });
  };

  return PasswordReset;
};
