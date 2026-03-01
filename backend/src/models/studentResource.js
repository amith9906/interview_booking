module.exports = (sequelize, DataTypes) => {
  const StudentResource = sequelize.define(
    'StudentResource',
    {
      student_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      resource_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      assigned_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      tableName: 'student_resources',
      timestamps: false
    }
  );

  StudentResource.associate = (models) => {
    StudentResource.belongsTo(models.Student, { foreignKey: 'student_id' });
    StudentResource.belongsTo(models.Resource, { foreignKey: 'resource_id' });
  };

  return StudentResource;
};
