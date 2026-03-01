 'use strict';

 module.exports = {
   async up(queryInterface, Sequelize) {
     await queryInterface.addColumn('hr_users', 'students_visible', {
       type: Sequelize.BOOLEAN,
       allowNull: false,
       defaultValue: true
     });

     await queryInterface.addColumn('email_verifications', 'target_email', {
       type: Sequelize.STRING,
       allowNull: true
     });

     await queryInterface.addColumn('email_verifications', 'purpose', {
       type: Sequelize.ENUM('initial', 'email_change'),
       allowNull: false,
       defaultValue: 'initial'
     });
   },

   async down(queryInterface) {
     await queryInterface.removeColumn('hr_users', 'students_visible');
     await queryInterface.removeColumn('email_verifications', 'target_email');
     await queryInterface.removeColumn('email_verifications', 'purpose');
     await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_email_verifications_purpose";');
   }
 };
