module.exports = (sequelize, DataTypes) => {
  const QuizAttempt = sequelize.define(
    'QuizAttempt',
    {
      assignment_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      score: {
        type: DataTypes.FLOAT,
        defaultValue: 0
      },
      status: {
        type: DataTypes.ENUM('passed', 'failed'),
        allowNull: false
      },
      started_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      day_key: {
        type: DataTypes.DATEONLY,
        allowNull: false
      }
    },
    {
      tableName: 'quiz_attempts',
      timestamps: true,
      updatedAt: 'updated_at',
      createdAt: 'created_at'
    }
  );

  QuizAttempt.associate = (models) => {
    QuizAttempt.belongsTo(models.QuizAssignment, { foreignKey: 'assignment_id', as: 'Assignment' });
  };

  return QuizAttempt;
};
