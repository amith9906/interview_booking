 'use strict';

 module.exports = {
   async up(queryInterface, Sequelize) {
     await queryInterface.createTable('points_rules', {
       id: {
         type: Sequelize.INTEGER,
         primaryKey: true,
         autoIncrement: true
       },
       skill_id: {
         type: Sequelize.INTEGER,
         allowNull: true,
         references: {
           model: 'skills',
           key: 'id'
         },
         onUpdate: 'CASCADE',
         onDelete: 'SET NULL'
       },
       min_experience: {
         type: Sequelize.INTEGER,
         defaultValue: 0
       },
       max_experience: {
         type: Sequelize.INTEGER,
         allowNull: true
       },
       cost_points: {
         type: Sequelize.INTEGER,
         allowNull: false,
         defaultValue: 10
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

   async down(queryInterface) {
     await queryInterface.dropTable('points_rules');
   }
 };
