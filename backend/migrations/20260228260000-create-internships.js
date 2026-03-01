module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('internships', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      company_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'companies', key: 'id' },
        onDelete: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: Sequelize.TEXT,
      duration_months: Sequelize.INTEGER,
      location: Sequelize.STRING,
      skills: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      published: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('internships');
  }
};
