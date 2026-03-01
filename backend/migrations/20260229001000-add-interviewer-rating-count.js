 'use strict';

 module.exports = {
   async up(queryInterface, Sequelize) {
     await queryInterface.addColumn('interviewers', 'rating_count', {
       type: Sequelize.INTEGER,
       defaultValue: 0
     });
   },

   async down(queryInterface) {
     await queryInterface.removeColumn('interviewers', 'rating_count');
   }
 };
