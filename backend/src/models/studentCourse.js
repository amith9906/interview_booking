module.exports = (sequelize, DataTypes) => {
  const StudentCourse = sequelize.define('StudentCourse', {
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('registered', 'completed', 'in_progress'),
      defaultValue: 'registered'
    }
  }, {
    tableName: 'student_courses'
  });

  StudentCourse.associate = (models) => {
    StudentCourse.belongsTo(models.Student, { foreignKey: 'student_id' });
    StudentCourse.belongsTo(models.Course, { foreignKey: 'course_id' });
  };

  return StudentCourse;
};
