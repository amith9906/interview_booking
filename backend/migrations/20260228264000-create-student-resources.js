module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('student_resources', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'students', key: 'id' },
        onDelete: 'CASCADE'
      },
      resource_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'resources', key: 'id' },
        onDelete: 'CASCADE'
      },
      assigned_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });
    await queryInterface.addConstraint('student_resources', {
      fields: ['student_id', 'resource_id'],
      type: 'unique',
      name: 'student_resource_unique'
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('student_resources');
  }
};
