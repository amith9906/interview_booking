module.exports = (sequelize, DataTypes) => {
  const Resume = sequelize.define('Resume', {
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    file_path: {
      type: DataTypes.STRING,
      allowNull: false
    },
    download_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    visible_to_hr: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'resumes'
  });

  Resume.associate = (models) => {
    Resume.belongsTo(models.Student, { foreignKey: 'student_id', as: 'Student' });
  };

  return Resume;
};
