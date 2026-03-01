module.exports = (sequelize, DataTypes) => {
  const QuizAssignment = sequelize.define(
    'QuizAssignment',
    {
      quiz_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      due_date: {
        type: DataTypes.DATE,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('pending', 'completed', 'missed'),
        defaultValue: 'pending'
      }
    },
    {
      tableName: 'quiz_assignments',
      timestamps: true,
      createdAt: 'assigned_at',
      updatedAt: 'updated_at'
    }
  );

  QuizAssignment.associate = (models) => {
    QuizAssignment.belongsTo(models.QuizCatalog, { foreignKey: 'quiz_id', as: 'Quiz' });
    QuizAssignment.belongsTo(models.User, { foreignKey: 'user_id', as: 'User' });
    QuizAssignment.hasMany(models.QuizAttempt, { foreignKey: 'assignment_id', as: 'Attempts' });
  };

  return QuizAssignment;
};
