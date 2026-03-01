module.exports = (sequelize, DataTypes) => {
  const Internship = sequelize.define(
    'Internship',
    {
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: DataTypes.TEXT,
      duration_months: DataTypes.INTEGER,
      location: DataTypes.STRING,
      skills: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
      },
      published: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    {
      tableName: 'internships'
    }
  );

  Internship.associate = (models) => {
    Internship.belongsTo(models.Company, { foreignKey: 'company_id', as: 'Company' });
    Internship.hasMany(models.StudentInternship, { foreignKey: 'internship_id', as: 'Registrations' });
  };

  return Internship;
};
