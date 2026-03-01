 'use strict';

 module.exports = {
   async up(queryInterface, Sequelize) {
     await queryInterface.createTable('quiz_catalogs', {
       id: {
         type: Sequelize.INTEGER,
         primaryKey: true,
         autoIncrement: true
       },
       title: {
         type: Sequelize.STRING,
         allowNull: false
       },
       skill_id: {
         type: Sequelize.INTEGER,
         allowNull: false,
         references: {
           model: 'skills',
           key: 'id'
         },
         onUpdate: 'CASCADE',
         onDelete: 'RESTRICT'
       },
       questions: {
         type: Sequelize.JSONB,
         defaultValue: []
       },
       published: {
         type: Sequelize.BOOLEAN,
         defaultValue: false
       },
       next_publish_at: {
         type: Sequelize.DATE,
         allowNull: true
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

     await queryInterface.createTable('quiz_assignments', {
       id: {
         type: Sequelize.INTEGER,
         primaryKey: true,
         autoIncrement: true
       },
       quiz_id: {
         type: Sequelize.INTEGER,
         allowNull: false,
         references: {
           model: 'quiz_catalogs',
           key: 'id'
         },
         onUpdate: 'CASCADE',
         onDelete: 'CASCADE'
       },
       user_id: {
         type: Sequelize.INTEGER,
         allowNull: false,
         references: {
           model: 'users',
           key: 'id'
         },
         onUpdate: 'CASCADE',
         onDelete: 'CASCADE'
       },
       due_date: {
         type: Sequelize.DATEONLY,
         allowNull: false
       },
       status: {
         type: Sequelize.ENUM('pending', 'completed', 'missed'),
         allowNull: false,
         defaultValue: 'pending'
       },
       assigned_at: {
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

     await queryInterface.createTable('quiz_attempts', {
       id: {
         type: Sequelize.INTEGER,
         primaryKey: true,
         autoIncrement: true
       },
       assignment_id: {
         type: Sequelize.INTEGER,
         allowNull: false,
         references: {
           model: 'quiz_assignments',
           key: 'id'
         },
         onUpdate: 'CASCADE',
         onDelete: 'CASCADE'
       },
       score: {
         type: Sequelize.FLOAT,
         defaultValue: 0
       },
       status: {
         type: Sequelize.ENUM('passed', 'failed'),
         allowNull: false
       },
       started_at: {
         type: Sequelize.DATE,
         allowNull: false,
         defaultValue: Sequelize.fn('NOW')
       },
       completed_at: {
         type: Sequelize.DATE,
         allowNull: true
       },
       day_key: {
         type: Sequelize.DATEONLY,
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

     await queryInterface.createTable('quiz_streaks', {
       id: {
         type: Sequelize.INTEGER,
         primaryKey: true,
         autoIncrement: true
       },
       user_id: {
         type: Sequelize.INTEGER,
         allowNull: false,
         references: {
           model: 'users',
           key: 'id'
         },
         onUpdate: 'CASCADE',
         onDelete: 'CASCADE'
       },
       skill_id: {
         type: Sequelize.INTEGER,
         allowNull: false,
         references: {
           model: 'skills',
           key: 'id'
         },
         onUpdate: 'CASCADE',
         onDelete: 'RESTRICT'
       },
       current_streak: {
         type: Sequelize.INTEGER,
         defaultValue: 0
       },
       longest_streak: {
         type: Sequelize.INTEGER,
         defaultValue: 0
       },
       last_attempt_day: {
         type: Sequelize.DATEONLY,
         allowNull: true
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
     await queryInterface.dropTable('quiz_streaks');
     await queryInterface.dropTable('quiz_attempts');
     await queryInterface.dropTable('quiz_assignments');
     await queryInterface.dropTable('quiz_catalogs');
     await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_quiz_assignments_status";');
     await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_quiz_attempts_status";');
   }
 };
