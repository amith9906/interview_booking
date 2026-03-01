module.exports = (sequelize, DataTypes) => {
  const StudentInternship = sequelize.define(
    'StudentInternship',
    {
      student_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      internship_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('registered', 'in_review', 'matched', 'started', 'completed', 'withdrawn'),
        defaultValue: 'registered'
      },
      desired_skills: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
      },
      purpose: DataTypes.TEXT,
      duration_months: DataTypes.INTEGER,
      start_date: DataTypes.DATE
    },
    {
      tableName: 'student_internships'
    }
  );

  StudentInternship.associate = (models) => {
    StudentInternship.belongsTo(models.Student, { foreignKey: 'student_id', as: 'Student' });
    StudentInternship.belongsTo(models.Internship, { foreignKey: 'internship_id', as: 'Internship' });
  };

  return StudentInternship;
};
