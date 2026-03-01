module.exports = (sequelize, DataTypes) => {
  const Company = sequelize.define('Company', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    }
    ,
    published: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    offers_internships: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'companies'
  });

  return Company;
};
