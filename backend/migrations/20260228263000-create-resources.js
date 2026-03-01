module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('resources', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: Sequelize.TEXT,
      link: Sequelize.STRING,
      file_url: Sequelize.STRING,
      resource_type: {
        type: Sequelize.ENUM('pdf', 'ppt', 'link', 'video', 'other'),
        defaultValue: 'other'
      },
      created_by_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
      },
      created_by_role: {
        type: Sequelize.ENUM('admin', 'interviewer'),
        allowNull: false
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
    await queryInterface.dropTable('resources');
  }
};
