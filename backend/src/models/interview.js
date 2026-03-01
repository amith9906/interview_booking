module.exports = (sequelize, DataTypes) => {
  const Interview = sequelize.define('Interview', {
    booking_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    },
    skill_ratings: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    skill_comments: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    overall_rating: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    feedback: DataTypes.TEXT,
    improve_areas: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    interviewer_feedback_published: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    interviewer_feedback_published_at: DataTypes.DATE,
    student_feedback_submitted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    student_feedback_submitted_at: DataTypes.DATE,
    student_skill_ratings: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    student_comments: DataTypes.TEXT,
    student_overall_rating: DataTypes.FLOAT
  }, {
    tableName: 'interviews'
  });

  return Interview;
};
