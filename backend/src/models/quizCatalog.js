module.exports = (sequelize, DataTypes) => {
  const QuizCatalog = sequelize.define(
    'QuizCatalog',
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      skill_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      questions: {
        type: DataTypes.JSONB,
        defaultValue: []
      },
      published: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      next_publish_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      tableName: 'quiz_catalogs',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  QuizCatalog.associate = (models) => {
    QuizCatalog.belongsTo(models.Skill, { foreignKey: 'skill_id', as: 'Skill' });
    QuizCatalog.hasMany(models.QuizAssignment, { foreignKey: 'quiz_id', as: 'Assignments' });
  };

  return QuizCatalog;
};
