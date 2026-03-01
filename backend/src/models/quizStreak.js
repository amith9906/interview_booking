module.exports = (sequelize, DataTypes) => {
  const QuizStreak = sequelize.define(
    'QuizStreak',
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      skill_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      current_streak: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      longest_streak: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      last_attempt_day: {
        type: DataTypes.DATEONLY,
        allowNull: true
      }
    },
    {
      tableName: 'quiz_streaks',
      timestamps: true,
      updatedAt: 'updated_at',
      createdAt: 'created_at'
    }
  );

  QuizStreak.associate = (models) => {
    QuizStreak.belongsTo(models.User, { foreignKey: 'user_id', as: 'User' });
    QuizStreak.belongsTo(models.Skill, { foreignKey: 'skill_id', as: 'Skill' });
  };

  return QuizStreak;
};
