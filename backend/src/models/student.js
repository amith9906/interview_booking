module.exports = (sequelize, DataTypes) => {
  const Student = sequelize.define('Student', {
    user_id: {
      type: DataTypes.INTEGER,
      unique: true
    },
    skills: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    endorsed_skills: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    experience_years: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    education: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    projects: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    hobbies: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    resume_file: DataTypes.STRING,
    ratings_avg: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    profile_status: {
      type: DataTypes.ENUM('draft', 'pending_review', 'approved', 'rejected'),
      defaultValue: 'draft'
    },
    pipeline_stage: {
      type: DataTypes.ENUM('shortlisted', 'interviewing', 'offered', 'rejected'),
      defaultValue: 'shortlisted'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    profile_rejected_reason: DataTypes.STRING,
    location: DataTypes.STRING,
    activation_reason: DataTypes.TEXT,
    deactivation_reason: DataTypes.TEXT,
    profile_submitted_at: DataTypes.DATE
  }, {
    tableName: 'students'
  });

  return Student;
};
