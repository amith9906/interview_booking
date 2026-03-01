module.exports = (sequelize, DataTypes) => {
  const ResourceAudit = sequelize.define(
    'ResourceAudit',
    {
      resource_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      student_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      performed_by_user_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      action: {
        type: DataTypes.STRING,
        allowNull: false
      },
      details: DataTypes.TEXT
      ,
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {
      tableName: 'resource_audits',
      timestamps: false
    }
  );

  ResourceAudit.associate = (models) => {
    ResourceAudit.belongsTo(models.Resource, { foreignKey: 'resource_id' });
    ResourceAudit.belongsTo(models.Student, { foreignKey: 'student_id' });
    ResourceAudit.belongsTo(models.User, { foreignKey: 'performed_by_user_id', as: 'PerformedBy' });
  };

  return ResourceAudit;
};
