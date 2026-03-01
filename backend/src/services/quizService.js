const { Op } = require('sequelize');
const {
  Skill,
  Student,
  User,
  QuizCatalog,
  QuizAssignment,
  QuizAttempt,
  QuizStreak
} = require('../models');
const { sendEmail, persistNotification } = require('./notificationService');
const { logError } = require('./monitoringService');

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const formatDayKey = (date) => date.toISOString().split('T')[0];
const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

const diffInDays = (later, earlier) => {
  if (!earlier) return Infinity;
  const laterDay = startOfDay(new Date(later));
  const earlierDay = startOfDay(new Date(earlier));
  const diffMs = laterDay - earlierDay;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

const publishScheduledQuizzes = async () => {
  const now = new Date();
  const scheduled = await QuizCatalog.findAll({
    where: {
      next_publish_at: { [Op.lte]: now }
    }
  });
  for (const quiz of scheduled) {
    quiz.published = true;
    quiz.next_publish_at = addDays(now, 1);
    await quiz.save();
  }
  return scheduled.length;
};

const assignQuiz = async (user, quiz) => {
  const today = startOfDay(new Date());
  const existing = await QuizAssignment.findOne({
    where: {
      user_id: user.id,
      quiz_id: quiz.id,
      due_date: today
    }
  });
  if (existing) return existing;
  return QuizAssignment.create({
    user_id: user.id,
    quiz_id: quiz.id,
    due_date: today
  });
};

const seedDailyAssignments = async () => {
  const today = startOfDay(new Date());
  const students = await Student.findAll({ include: [{ model: User, as: 'User' }] });
  const publishedQuizzes = await QuizCatalog.findAll({
    where: { published: true },
    include: [{ model: Skill, as: 'Skill' }]
  });
  const assignments = [];
  for (const student of students) {
    const studentSkills = student.skills || [];
    for (const quiz of publishedQuizzes) {
      if (!studentSkills.includes(quiz.skill_id.toString()) && !studentSkills.includes(String(quiz.skill_id))) {
        continue;
      }
      const assignment = await assignQuiz(student.User, quiz);
      assignments.push(assignment);
    }
  }
  return assignments.length;
};

const updateStreak = async (userId, skillId, dayKey, successful) => {
  const streak = await QuizStreak.findOne({
    where: { user_id: userId, skill_id: skillId }
  });
  const day = new Date(dayKey);
  if (!streak) {
    return QuizStreak.create({
      user_id: userId,
      skill_id: skillId,
      current_streak: successful ? 1 : 0,
      longest_streak: successful ? 1 : 0,
      last_attempt_day: successful ? dayKey : null
    });
  }
  if (!successful) return streak;
  if (!streak.last_attempt_day) {
    streak.current_streak = 1;
  } else {
    const diff = diffInDays(dayKey, streak.last_attempt_day);
    if (diff === 0) {
      // same day, keep streak
    } else if (diff === 1) {
      streak.current_streak += 1;
    } else {
      streak.current_streak = 1;
    }
  }
  streak.last_attempt_day = dayKey;
  if (streak.current_streak > streak.longest_streak) {
    streak.longest_streak = streak.current_streak;
  }
  await streak.save();
  return streak;
};

const recordQuizAttempt = async ({ assignmentId, score, status }) => {
  const assignment = await QuizAssignment.findByPk(assignmentId, {
    include: [{ model: QuizCatalog, as: 'Quiz' }]
  });
  if (!assignment) throw new Error('Assignment missing');
  const dayKey = formatDayKey(new Date());
  const attempt = await QuizAttempt.create({
    assignment_id: assignmentId,
    score,
    status,
    completed_at: new Date(),
    day_key: dayKey
  });
  assignment.status = 'completed';
  await assignment.save();
  await updateStreak(assignment.user_id, assignment.Quiz.skill_id, dayKey, status === 'passed');
  return attempt;
};

const remindPendingAssignments = async () => {
  const today = startOfDay(new Date());
  const pending = await QuizAssignment.findAll({
    where: {
      due_date: today,
      status: 'pending'
    },
    include: [
      { model: User, as: 'User' },
      { model: QuizCatalog, as: 'Quiz', include: [{ model: Skill, as: 'Skill' }] }
    ]
  });
  for (const assignment of pending) {
    try {
      await sendEmail({
        to: assignment.User.email,
        subject: 'Daily coding quiz reminder',
        text: `Your skill drill for ${assignment.Quiz.Skill?.name || 'a priority skill'} is due today. Try to complete it before midnight to keep your streak alive.`
      });
      await persistNotification({
        userId: assignment.User.id,
        type: 'quiz',
        message: `Reminder sent for ${assignment.Quiz.title}`,
        meta: { assignmentId: assignment.id }
      });
    } catch (err) {
      logError(err, { path: 'quizService.remindPendingAssignments', method: 'job' });
    }
  }
  return pending.length;
};

module.exports = {
  publishScheduledQuizzes,
  seedDailyAssignments,
  recordQuizAttempt,
  remindPendingAssignments
};
