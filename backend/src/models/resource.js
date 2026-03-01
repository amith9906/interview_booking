module.exports = (sequelize, DataTypes) => {
  const Resource = sequelize.define(
    'Resource',
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: DataTypes.TEXT,
      link: DataTypes.STRING,
      file_url: DataTypes.STRING,
      resource_type: {
        type: DataTypes.ENUM('pdf', 'ppt', 'link', 'video', 'other'),
        defaultValue: 'other'
      },
      visible_to_hr: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      created_by_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      created_by_role: {
        type: DataTypes.ENUM('admin', 'interviewer'),
        allowNull: false
      }
    },
    {
      tableName: 'resources'
    }
  );

  Resource.associate = (models) => {
    Resource.belongsTo(models.User, { foreignKey: 'created_by_user_id', as: 'Creator' });
    Resource.hasMany(models.StudentResource, { foreignKey: 'resource_id', as: 'Assignments' });
  };

  return Resource;
};
