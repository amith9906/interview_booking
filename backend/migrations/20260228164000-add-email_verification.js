'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const userInfo = await queryInterface.describeTable('users');
    if (!userInfo.email_verified) {
      await queryInterface.addColumn('users', 'email_verified', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }

    const [existingTable] = await queryInterface.sequelize.query(
      "SELECT to_regclass('public.email_verifications') AS table_exists",
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (!existingTable.table_exists) {
      await queryInterface.createTable('email_verifications', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        code: {
          type: Sequelize.STRING,
          allowNull: false
        },
        expires_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        used: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.fn('now')
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.fn('now')
        }
      });
    }
  },

  async down(queryInterface) {
    const userInfo = await queryInterface.describeTable('users');
    if (userInfo.email_verified) {
      await queryInterface.removeColumn('users', 'email_verified');
    }
    const [existingTable] = await queryInterface.sequelize.query(
      "SELECT to_regclass('public.email_verifications') AS table_exists",
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (existingTable.table_exists) {
      await queryInterface.dropTable('email_verifications');
    }
  }
};
