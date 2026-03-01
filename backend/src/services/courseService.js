const { Course, StudentCourse } = require('../models');

const enrollStudentCourses = async (studentId, courseIds = []) => {
  const ids = courseIds.filter(Boolean);
  if (!ids.length) return;
  const courses = await Course.findAll({ where: { id: ids } });
  if (!courses.length) return;
  const payload = courses.map((course) => ({
    student_id: studentId,
    course_id: course.id,
    status: 'registered'
  }));
  await StudentCourse.bulkCreate(payload, { updateOnDuplicate: ['status'] });
};

module.exports = { enrollStudentCourses };
