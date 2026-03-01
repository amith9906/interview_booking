module.exports = (sequelize, DataTypes) => {
  const PointsRule = sequelize.define(
    'PointsRule',
    {
      skill_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      min_experience: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      max_experience: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      cost_points: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10
      }
    },
    {
      tableName: 'points_rules',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  PointsRule.associate = (models) => {
    PointsRule.belongsTo(models.Skill, { foreignKey: 'skill_id', as: 'Skill' });
  };

  return PointsRule;
};
