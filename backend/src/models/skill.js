module.exports = (sequelize, DataTypes) => {
  const Skill = sequelize.define('Skill', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    published: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'skills'
  });

  return Skill;
};
