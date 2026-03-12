/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const info = await queryInterface.describeTable('resources');
    if (!info.visible_to_hr) {
      await queryInterface.addColumn('resources', 'visible_to_hr', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }
  },

  async down(queryInterface) {
    const info = await queryInterface.describeTable('resources');
    if (info.visible_to_hr) {
      await queryInterface.removeColumn('resources', 'visible_to_hr');
    }
  }
};
