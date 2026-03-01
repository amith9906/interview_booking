const { User, Student, Interviewer } = require('../models');
const { PROFILE_STATUS, determineProfileStatusAfterUpdate } = require('../utils/profileStatus');
const { fetchProfileForUser } = require('../services/profileService');

const normalizeArrayValue = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === 'string' ? item.trim() : item)).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return undefined;
};

const parseProjects = (value) => {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? { title: item.trim() } : item))
      .filter((project) => project && project.title);
  }
  if (typeof value === 'string') {
    const entries = value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (!entries.length) return undefined;
    return entries.map((entry) => {
      const [titlePart, ...rest] = entry.split(' - ');
      return {
        title: titlePart.trim(),
        description: rest.join(' - ').trim()
      };
    });
  }
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch (err) {
    // ignore invalid JSON
  }
  return undefined;
};

const parseAvailability = (value) => {
  if (!value) return undefined;
  if (Array.isArray(value)) return value;
  try {
    if (typeof value === 'string') {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    // ignore invalid
  }
  return undefined;
};

const getMyProfile = async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const profile = await fetchProfileForUser(user);
  return res.json({ user: { id: user.id, email: user.email, role: user.role, name: user.name, phone: user.phone }, profile });
};

const updateMyProfile = async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!['student', 'interviewer'].includes(user.role)) {
    return res.status(403).json({ message: 'Profile updates are only available for students and interviewers' });
  }

  const profileModel = user.role === 'student'
    ? await Student.findOne({ where: { user_id: user.id } })
    : await Interviewer.findOne({ where: { user_id: user.id } });
  if (!profileModel) return res.status(404).json({ message: 'Profile record missing' });
const { name, phone, location, meeting_link } = req.body;
  const userUpdates = {};
  if (name && name !== user.name) {
    user.name = name;
    userUpdates.name = name;
  }
  if (phone && phone !== user.phone) {
    user.phone = phone;
    userUpdates.phone = phone;
  }
  if (Object.keys(userUpdates).length) {
    await user.save();
  }

  const updates = {};
  if (req.body.experience_years !== undefined) {
    const parsedExp = parseInt(req.body.experience_years, 10);
    if (!Number.isNaN(parsedExp)) updates.experience_years = parsedExp;
  }
  const skills = normalizeArrayValue(req.body.skills);
  if (skills) {
    if (user.role === 'student') updates.skills = skills;
    if (user.role === 'interviewer') updates.skill_set = skills;
  }
  const skillSet = normalizeArrayValue(req.body.skill_set);
  if (skillSet && user.role === 'interviewer') updates.skill_set = skillSet;
  const hobbies = normalizeArrayValue(req.body.hobbies);
  if (hobbies) updates.hobbies = hobbies;
  const projects = parseProjects(req.body.projects);
  if (projects) updates.projects = projects;
  if (req.body.bio !== undefined && user.role === 'interviewer') {
    updates.bio = req.body.bio;
  }
  if (meeting_link !== undefined && user.role === 'interviewer') {
    const trimmedLink = typeof meeting_link === 'string' ? meeting_link.trim() : meeting_link;
    updates.meeting_link = trimmedLink ? trimmedLink : null;
  }
  if (req.body.rate !== undefined && user.role === 'interviewer') {
    const parsedRate = Number(req.body.rate);
    if (!Number.isNaN(parsedRate)) updates.rate = parsedRate;
  }
  const availability = parseAvailability(req.body.availability_slots);
  if (availability !== undefined && user.role === 'interviewer') {
    updates.availability_slots = availability;
  }
  if (req.body.resume_file !== undefined && user.role === 'student') {
    updates.resume_file = req.body.resume_file;
  }
  if (location !== undefined && user.role === 'student') {
    const trimmedLocation = typeof location === 'string' ? location.trim() : location;
    updates.location = trimmedLocation ? trimmedLocation : null;
  }

  if (!Object.keys(updates).length && !Object.keys(userUpdates).length) {
    return res.status(400).json({ message: 'No profile attributes provided' });
  }

  await profileModel.update(updates);
  profileModel.profile_status = determineProfileStatusAfterUpdate(profileModel, user.role);
  profileModel.profile_rejected_reason = null;
  if (profileModel.profile_status === PROFILE_STATUS.PENDING_REVIEW) {
    profileModel.profile_submitted_at = new Date();
  } else if (profileModel.profile_status === PROFILE_STATUS.DRAFT) {
    profileModel.profile_submitted_at = null;
  }
  await profileModel.save();

  const profile = await fetchProfileForUser(user);
  res.json({ profile });
};

module.exports = { getMyProfile, updateMyProfile };
