const { Op } = require('sequelize');
const {
  QuizCatalog,
  QuizAssignment,
  QuizAttempt,
  QuizStreak,
  Skill
} = require('../models');
const { recordQuizAttempt } = require('../services/quizService');

const getTodayAssignment = async (req, res) => {
  const today = new Date();
  const assignment = await QuizAssignment.findOne({
    where: {
      user_id: req.user.id,
      due_date: today
    },
    include: [
      { model: QuizCatalog, as: 'Quiz', include: [{ model: Skill, as: 'Skill' }] },
      { model: QuizAttempt, as: 'Attempts' }
    ]
  });
  if (!assignment) {
    return res.status(404).json({ message: 'No quiz assigned today' });
  }
  return res.json({ assignment });
};

const submitAttempt = async (req, res) => {
  const { assignment_id, score, status } = req.body;
  if (!assignment_id || typeof score !== 'number' || !['passed', 'failed'].includes(status)) {
    return res.status(400).json({ message: 'assignment_id, score, and status required' });
  }
  const attempt = await recordQuizAttempt({ assignmentId: assignment_id, score, status });
  res.json({ attempt });
};

const getStreaks = async (req, res) => {
  const streaks = await QuizStreak.findAll({
    where: { user_id: req.user.id },
    include: [{ model: Skill, as: 'Skill' }]
  });
  res.json({ streaks });
};

const listQuizCatalog = async (req, res) => {
  const quizzes = await QuizCatalog.findAll({
    include: [{ model: Skill, as: 'Skill' }]
  });
  res.json({ quizzes });
};

const getQuizKpi = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const assignments = await QuizAssignment.count({
    where: { due_date: today }
  });
  const publishedQuizzes = await QuizCatalog.count({ where: { published: true } });
  const attemptsToday = await QuizAttempt.count({
    where: {
      completed_at: { [Op.gte]: today }
    }
  });
  const latestAssignments = await QuizAssignment.findAll({
    include: [{ model: QuizCatalog, as: 'Quiz', include: [{ model: Skill, as: 'Skill' }] }],
    limit: 5,
    order: [['due_date', 'DESC']]
  });
  const streaks = await QuizStreak.count();
  res.json({
    totalQuizzes: publishedQuizzes,
    assignmentsDue: assignments,
    attemptsToday,
    streakCount: streaks,
    latestAssignments: latestAssignments.map((assignment) => ({
      id: assignment.id,
      due_date: assignment.due_date,
      skill: assignment.Quiz?.Skill?.name,
      quiz: assignment.Quiz?.title,
      userId: assignment.user_id
    }))
  });
};

const exportQuizAttempts = async (req, res) => {
  const attempts = await QuizAttempt.findAll({
    include: [
      {
        model: QuizAssignment,
        as: 'Assignment',
        include: [
          { model: QuizCatalog, as: 'Quiz', include: [{ model: Skill, as: 'Skill' }] }
        ]
      }
    ],
    order: [['completed_at', 'DESC']]
  });
  const lines = attempts.map((attempt) => [
    attempt.id,
    attempt.status,
    attempt.score,
    attempt.completed_at?.toISOString() || '',
    attempt.Assignment?.user_id,
    attempt.Assignment?.Quiz?.Skill?.name,
    attempt.Assignment?.Quiz?.title
  ].map((value) => `"${String(value ?? '')}"`).join(','));
  const csv = ['id,status,score,completed_at,user_id,skill,quiz', ...lines].join('\n');
  res.setHeader('Content-Disposition', 'attachment; filename="quiz-attempts.csv"');
  res.setHeader('Content-Type', 'text/csv');
  res.send(csv);
};

const createQuizCatalog = async (req, res) => {
  const { title, skill_id, questions = [], published = false, next_publish_at } = req.body;
  const quiz = await QuizCatalog.create({
    title,
    skill_id,
    questions,
    published,
    next_publish_at
  });
  res.status(201).json({ quiz });
};

const updateQuizCatalog = async (req, res) => {
  const { id } = req.params;
  const { title, skill_id, questions, published, next_publish_at } = req.body;
  const quiz = await QuizCatalog.findByPk(id);
  if (!quiz) {
    return res.status(404).json({ message: 'Quiz not found' });
  }
  if (title !== undefined) quiz.title = title;
  if (skill_id !== undefined) quiz.skill_id = skill_id;
  if (questions !== undefined) quiz.questions = questions;
  if (published !== undefined) quiz.published = published;
  if (next_publish_at !== undefined) quiz.next_publish_at = next_publish_at;
  await quiz.save();
  res.json({ quiz });
};

const toggleQuizPublish = async (req, res) => {
  const { id } = req.params;
  const { published, next_publish_at } = req.body;
  const quiz = await QuizCatalog.findByPk(id);
  if (!quiz) {
    return res.status(404).json({ message: 'Quiz not found' });
  }
  quiz.published = published === undefined ? !quiz.published : published;
  if (next_publish_at !== undefined) {
    quiz.next_publish_at = next_publish_at;
  }
  await quiz.save();
  res.json({ quiz });
};

module.exports = {
  getTodayAssignment,
  submitAttempt,
  getStreaks,
  listQuizCatalog,
  getQuizKpi,
  exportQuizAttempts,
  createQuizCatalog,
  updateQuizCatalog,
  toggleQuizPublish
};
