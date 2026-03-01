module.exports = (sequelize, DataTypes) => {
  const Interviewer = sequelize.define('Interviewer', {
    user_id: {
      type: DataTypes.INTEGER,
      unique: true
    },
    title: {
      type: DataTypes.STRING,
      defaultValue: 'Interviewer'
    },
    company_id: DataTypes.INTEGER,
    availability_slots: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    skill_set: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    experience_years: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    bio: DataTypes.TEXT,
    meeting_link: {
      type: DataTypes.STRING,
      allowNull: true
    },
    rate: {
      type: DataTypes.INTEGER,
      defaultValue: 1000
    },
    projects: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    hobbies: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    average_rating: {
      type: DataTypes.FLOAT,
      defaultValue: 4.8
    },
    profile_status: {
      type: DataTypes.ENUM('draft', 'pending_review', 'approved', 'rejected'),
      defaultValue: 'draft'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    rating_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    profile_rejected_reason: DataTypes.STRING,
    activation_reason: DataTypes.TEXT,
    deactivation_reason: DataTypes.TEXT,
    profile_submitted_at: DataTypes.DATE
  }, {
    tableName: 'interviewers'
  });

  return Interviewer;
};
