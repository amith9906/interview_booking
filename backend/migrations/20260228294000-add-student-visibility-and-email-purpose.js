'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const hrInfo = await queryInterface.describeTable('hr_users');
    if (!hrInfo.students_visible) {
      await queryInterface.addColumn('hr_users', 'students_visible', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      });
    }

    const emailVerificationTable = await queryInterface.sequelize.query(
      "SELECT to_regclass('public.email_verifications') AS table_exists",
      { type: Sequelize.QueryTypes.SELECT }
    );
    const tableExists = emailVerificationTable[0]?.table_exists;
    if (tableExists) {
      const emailInfo = await queryInterface.describeTable('email_verifications');
      if (!emailInfo.target_email) {
        await queryInterface.addColumn('email_verifications', 'target_email', {
          type: Sequelize.STRING,
          allowNull: true
        });
      }
      if (!emailInfo.purpose) {
        await queryInterface.addColumn('email_verifications', 'purpose', {
          type: Sequelize.ENUM('initial', 'email_change'),
          allowNull: false,
          defaultValue: 'initial'
        });
      }
    }
  },

  async down(queryInterface) {
    const hrInfo = await queryInterface.describeTable('hr_users');
    if (hrInfo.students_visible) {
      await queryInterface.removeColumn('hr_users', 'students_visible');
    }
    const [emailExist] = await queryInterface.sequelize.query(
      "SELECT to_regclass('public.email_verifications') AS table_exists",
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (emailExist.table_exists) {
      const emailInfo = await queryInterface.describeTable('email_verifications');
      if (emailInfo.purpose) {
        await queryInterface.removeColumn('email_verifications', 'purpose');
      }
      if (emailInfo.target_email) {
        await queryInterface.removeColumn('email_verifications', 'target_email');
      }
    }
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_email_verifications_purpose";');
  }
};
