module.exports = (sequelize, DataTypes) => {
  const Course = sequelize.define('Course', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    level: DataTypes.STRING,
    duration_weeks: DataTypes.INTEGER,
    description: DataTypes.TEXT,
    instructor_name: DataTypes.STRING,
    instructor_title: DataTypes.STRING,
    instructor_email: DataTypes.STRING,
    instructor_bio: DataTypes.TEXT,
    published: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'courses'
  });

  Course.associate = (models) => {
    Course.belongsToMany(models.Student, { through: models.StudentCourse, foreignKey: 'course_id', otherKey: 'student_id' });
    Course.hasMany(models.StudentCourse, { foreignKey: 'course_id', as: 'StudentCourses' });
  };

  return Course;
};
