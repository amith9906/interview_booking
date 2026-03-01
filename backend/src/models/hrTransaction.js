module.exports = (sequelize, DataTypes) => {
  const HrTransaction = sequelize.define('HrTransaction', {
    hr_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('credit_add', 'download', 'subscription'),
      allowNull: false
    },
    credits_change: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    description: DataTypes.TEXT,
    resume_id: DataTypes.INTEGER
  }, {
    tableName: 'hr_transactions'
  });

  HrTransaction.associate = (models) => {
    HrTransaction.belongsTo(models.HrUser, { foreignKey: 'hr_user_id', as: 'hrUser' });
    HrTransaction.belongsTo(models.Resume, { foreignKey: 'resume_id', as: 'resume' });
  };

  return HrTransaction;
};
