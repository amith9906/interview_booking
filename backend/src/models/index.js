const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const User = require('./user')(sequelize, Sequelize.DataTypes);
const Student = require('./student')(sequelize, Sequelize.DataTypes);
const Interviewer = require('./interviewer')(sequelize, Sequelize.DataTypes);
const Company = require('./company')(sequelize, Sequelize.DataTypes);
const Booking = require('./booking')(sequelize, Sequelize.DataTypes);
const Interview = require('./interview')(sequelize, Sequelize.DataTypes);
const Course = require('./course')(sequelize, Sequelize.DataTypes);
const StudentCourse = require('./studentCourse')(sequelize, Sequelize.DataTypes);
const HrUser = require('./hrUser')(sequelize, Sequelize.DataTypes);
const Resume = require('./resume')(sequelize, Sequelize.DataTypes);
const Skill = require('./skill')(sequelize, Sequelize.DataTypes);
const HrTransaction = require('./hrTransaction')(sequelize, Sequelize.DataTypes);
const PaymentAudit = require('./paymentAudit')(sequelize, Sequelize.DataTypes);
const Notification = require('./notification')(sequelize, Sequelize.DataTypes);
const EmailVerification = require('./emailVerification')(sequelize, Sequelize.DataTypes);
const Internship = require('./internship')(sequelize, Sequelize.DataTypes);
const StudentInternship = require('./studentInternship')(sequelize, Sequelize.DataTypes);
const Resource = require('./resource')(sequelize, Sequelize.DataTypes);
const StudentResource = require('./studentResource')(sequelize, Sequelize.DataTypes);
const ResourceAudit = require('./resourceAudit')(sequelize, Sequelize.DataTypes);
const PointsRule = require('./pointsRule')(sequelize, Sequelize.DataTypes);
const QuizCatalog = require('./quizCatalog')(sequelize, Sequelize.DataTypes);
const QuizAssignment = require('./quizAssignment')(sequelize, Sequelize.DataTypes);
const QuizAttempt = require('./quizAttempt')(sequelize, Sequelize.DataTypes);
const QuizStreak = require('./quizStreak')(sequelize, Sequelize.DataTypes);
const PasswordReset = require('./passwordReset')(sequelize, Sequelize.DataTypes);

User.hasOne(Student, { foreignKey: 'user_id', as: 'studentProfile' });
Student.belongsTo(User, { foreignKey: 'user_id' });
User.hasOne(Interviewer, { foreignKey: 'user_id', as: 'interviewerProfile' });
Interviewer.belongsTo(User, { foreignKey: 'user_id' });

Company.hasMany(Interviewer, { foreignKey: 'company_id' });
Interviewer.belongsTo(Company, { foreignKey: 'company_id' });
Company.hasMany(Internship, { foreignKey: 'company_id' });
Internship.belongsTo(Company, { foreignKey: 'company_id', as: 'Company' });

Student.hasMany(Booking, { foreignKey: 'student_id' });
Booking.belongsTo(Student, { foreignKey: 'student_id' });
Interviewer.hasMany(Booking, { foreignKey: 'interviewer_id' });
Booking.belongsTo(Interviewer, { foreignKey: 'interviewer_id' });

Booking.hasOne(Interview, { foreignKey: 'booking_id', as: 'interviewDetails' });
Interview.belongsTo(Booking, { foreignKey: 'booking_id' });

Student.hasMany(Resume, { foreignKey: 'student_id', as: 'Resumes' });
Resume.belongsTo(Student, { foreignKey: 'student_id', as: 'Student' });

Student.belongsToMany(Course, { through: StudentCourse, foreignKey: 'student_id', otherKey: 'course_id', as: 'Courses' });
Course.belongsToMany(Student, { through: StudentCourse, foreignKey: 'course_id', otherKey: 'student_id', as: 'Students' });
Student.hasMany(StudentCourse, { foreignKey: 'student_id', as: 'StudentCourses' });
Course.hasMany(StudentCourse, { foreignKey: 'course_id', as: 'StudentCourses' });
StudentCourse.belongsTo(Student, { foreignKey: 'student_id' });
StudentCourse.belongsTo(Course, { foreignKey: 'course_id' });

Student.belongsToMany(Internship, {
  through: StudentInternship,
  foreignKey: 'student_id',
  otherKey: 'internship_id',
  as: 'Internships'
});
Internship.belongsToMany(Student, {
  through: StudentInternship,
  foreignKey: 'internship_id',
  otherKey: 'student_id',
  as: 'Students'
});
Student.hasMany(StudentInternship, { foreignKey: 'student_id', as: 'StudentInternships' });
Internship.hasMany(StudentInternship, { foreignKey: 'internship_id', as: 'Registrations' });
StudentInternship.belongsTo(Student, { foreignKey: 'student_id', as: 'Student' });
StudentInternship.belongsTo(Internship, { foreignKey: 'internship_id', as: 'Internship' });

Resource.belongsTo(User, { foreignKey: 'created_by_user_id', as: 'Creator' });
Resource.hasMany(StudentResource, { foreignKey: 'resource_id', as: 'Assignments' });
Resource.hasMany(ResourceAudit, { foreignKey: 'resource_id', as: 'Audits' });
StudentResource.belongsTo(Resource, { foreignKey: 'resource_id', as: 'Resource' });
StudentResource.belongsTo(Student, { foreignKey: 'student_id', as: 'Student' });
Student.hasMany(StudentResource, { foreignKey: 'student_id', as: 'SharedResources' });
Student.hasMany(ResourceAudit, { foreignKey: 'student_id', as: 'ResourceAudits' });

ResourceAudit.belongsTo(User, { foreignKey: 'performed_by_user_id', as: 'PerformedByUser' });

User.hasOne(HrUser, { foreignKey: 'user_id', as: 'hrProfile' });
HrUser.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'recipient' });
User.hasMany(EmailVerification, { foreignKey: 'user_id', as: 'EmailVerifications' });
EmailVerification.belongsTo(User, { foreignKey: 'user_id', as: 'User' });

HrUser.hasMany(HrTransaction, { foreignKey: 'hr_user_id', as: 'Transactions' });
HrTransaction.belongsTo(HrUser, { foreignKey: 'hr_user_id', as: 'hrUser' });
HrTransaction.belongsTo(Resume, { foreignKey: 'resume_id', as: 'resume' });

Student.hasMany(PaymentAudit, { foreignKey: 'student_id' });
PaymentAudit.belongsTo(Student, { foreignKey: 'student_id' });
Booking.hasMany(PaymentAudit, { foreignKey: 'booking_id' });
PaymentAudit.belongsTo(Booking, { foreignKey: 'booking_id' });

QuizCatalog.belongsTo(Skill, { foreignKey: 'skill_id', as: 'Skill' });
QuizCatalog.hasMany(QuizAssignment, { foreignKey: 'quiz_id', as: 'Assignments' });

QuizAssignment.belongsTo(QuizCatalog, { foreignKey: 'quiz_id', as: 'Quiz' });
QuizAssignment.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
QuizAssignment.hasMany(QuizAttempt, { foreignKey: 'assignment_id', as: 'Attempts' });

QuizAttempt.belongsTo(QuizAssignment, { foreignKey: 'assignment_id', as: 'Assignment' });

QuizStreak.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
QuizStreak.belongsTo(Skill, { foreignKey: 'skill_id', as: 'Skill' });

PointsRule.belongsTo(Skill, { foreignKey: 'skill_id', as: 'Skill' });

module.exports = {
  sequelize,
  Sequelize,
  User,
  Student,
  Interviewer,
  Company,
  Booking,
  Interview,
  Course,
  StudentCourse,
  HrUser,
  Resume,
  Skill,
  HrTransaction,
  PaymentAudit,
  Notification,
  EmailVerification,
  Internship,
  StudentInternship,
  Resource,
  StudentResource,
  ResourceAudit,
  PasswordReset,
  QuizCatalog,
  QuizAssignment,
  QuizAttempt,
  QuizStreak,
  PointsRule
};
