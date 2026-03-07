const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { User, Student, Interviewer, HrUser, EmailVerification, PasswordReset } = require('../models');
const { generateToken } = require('../utils/jwt');
const { enrollStudentCourses } = require('../services/courseService');
const {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail
} = require('../services/notificationService');
const { PROFILE_STATUS } = require('../utils/profileStatus');
const { fetchProfileForUser } = require('../services/profileService');

const VERIFICATION_TTL_MINUTES = 10;
const PASSWORD_RESET_TTL_MINUTES = 15;

const buildUserResponse = (user) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  name: user.name,
  phone: user.phone
});


const createEmailVerification = async (userId, { purpose = 'initial', targetEmail = null } = {}) => {
  await EmailVerification.destroy({ where: { user_id: userId, purpose } });
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires_at = new Date(Date.now() + VERIFICATION_TTL_MINUTES * 60 * 1000);
  await EmailVerification.create({
    user_id: userId,
    code,
    expires_at,
    purpose,
    target_email: targetEmail
  });
  return code;
};

const resendVerificationCode = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.email_verified) return res.status(400).json({ message: 'Email already verified' });
  const code = await createEmailVerification(user.id);
  await sendVerificationEmail({ to: user.email, code });
  res.json({ message: 'Verification code resent' });
};

const createPasswordReset = async (userId) => {
  await PasswordReset.destroy({ where: { user_id: userId } });
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires_at = new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000);
  await PasswordReset.create({ user_id: userId, code, expires_at });
  return code;
};

const REGISTERABLE_ROLES = ['student', 'interviewer'];
const register = async (req, res) => {
  const { email, password, role = 'student', name, phone, profile = {} } = req.body;
  if (!email || !password || !phone) {
    return res.status(400).json({ message: 'Email, password and mobile number required' });
  }
  if (!REGISTERABLE_ROLES.includes(role)) {
    return res.status(403).json({ message: 'Registrations are limited to students and interviewers' });
  }
  const existing = await User.findOne({ where: { email } });
  if (existing) return res.status(409).json({ message: 'Email already taken' });
  const password_hash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, password_hash, role, name, phone });
  if (role === 'student') {
    const student = await Student.create({
      user_id: user.id,
      profile_status: PROFILE_STATUS.DRAFT,
      ...profile
    });
    if (profile.course_ids?.length) {
      await enrollStudentCourses(student.id, profile.course_ids);
    }
  } else if (role === 'interviewer') {
    await Interviewer.create({
      user_id: user.id,
      profile_status: PROFILE_STATUS.DRAFT,
      ...profile
    });
  } else if (role === 'hr') {
    await HrUser.create({ user_id: user.id, ...profile });
  }
  const code = await createEmailVerification(user.id);
  await sendVerificationEmail({ to: user.email, code });
  return res.status(201).json({ message: 'Verification code sent to your email' });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  // Check if account is locked
  if (user.lockout_until && user.lockout_until > new Date()) {
    const remainingTime = Math.ceil((user.lockout_until - new Date()) / 60000);
    return res.status(403).json({ 
      message: `Account is temporarily locked. Try again in ${remainingTime} minutes.` 
    });
  }

    if (!user.is_active) {
        return res.status(403).json({ message: 'Your account has been deactivated. Please contact support.' });
    }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    user.failed_login_attempts += 1;
    if (user.failed_login_attempts >= 5) {
      user.lockout_until = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
      user.failed_login_attempts = 0;
      await user.save();
      return res.status(403).json({ 
        message: 'Too many failed attempts. Account locked for 15 minutes.' 
      });
    }
    await user.save();
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (!user.email_verified) return res.status(403).json({ message: 'Email not verified' });

  // Reset failed attempts on successful login
  user.failed_login_attempts = 0;
  user.lockout_until = null;
  await user.save();

  const token = generateToken({ id: user.id, role: user.role, email: user.email });
  const profileData = await fetchProfileForUser(user);
  res.json({ user: buildUserResponse(user), profile: profileData, token });
};

const verifyEmail = async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ message: 'Email and code are required' });
  }
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.email_verified) return res.status(400).json({ message: 'Email already verified' });
  const verification = await EmailVerification.findOne({
    where: {
      user_id: user.id,
      code,
      used: false,
      purpose: 'initial',
      expires_at: { [Op.gt]: new Date() }
    }
  });
  if (!verification) {
    return res.status(400).json({ message: 'Invalid or expired code' });
  }
  verification.used = true;
  await verification.save();
  user.email_verified = true;
  await user.save();
  const profileData = await fetchProfileForUser(user);
  const token = generateToken({ id: user.id, role: user.role, email: user.email });
  await sendWelcomeEmail({ role: user.role, to: user.email, name: user.name, userId: user.id });
  res.json({ user: buildUserResponse(user), profile: profileData, token });
};

const requestEmailChange = async (req, res) => {
  const { email: newEmail } = req.body;
  if (!newEmail) return res.status(400).json({ message: 'New email required' });
  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (newEmail === user.email) return res.status(400).json({ message: 'New email must differ from current' });
  const existing = await User.findOne({ where: { email: newEmail } });
  if (existing) return res.status(409).json({ message: 'Email already in use' });
  const code = await createEmailVerification(user.id, { purpose: 'email_change', targetEmail: newEmail });
  await sendVerificationEmail({
    to: newEmail,
    code,
    subject: 'Confirm your new Interview Booking email',
    text: `Use ${code} to verify your new email address on Interview Booking.`
  });
  res.json({ message: 'Verification code sent to the new email address' });
};

const verifyEmailChange = async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: 'Code required' });
  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const verification = await EmailVerification.findOne({
    where: {
      user_id: user.id,
      code,
      used: false,
      purpose: 'email_change',
      expires_at: { [Op.gt]: new Date() }
    }
  });
  if (!verification) {
    return res.status(400).json({ message: 'Invalid or expired code' });
  }
  if (!verification.target_email) {
    return res.status(400).json({ message: 'Missing target email for change' });
  }
  user.email = verification.target_email;
  user.email_verified = true;
  await user.save();
  verification.used = true;
  await verification.save();
  res.json({ message: 'Email updated', email: user.email });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });
  const user = await User.findOne({ where: { email } });
  if (user) {
    const code = await createPasswordReset(user.id);
    await sendPasswordResetEmail({ to: user.email, code });
  }
  return res.json({ message: 'If an account exists, a password reset code was sent to the email provided.' });
};

const resetPassword = async (req, res) => {
  const { email, code, password } = req.body;
  if (!email || !code || !password) {
    return res.status(400).json({ message: 'Email, code, and new password are required' });
  }
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(404).json({ message: 'User not found' });
  const reset = await PasswordReset.findOne({
    where: {
      user_id: user.id,
      code,
      used: false,
      expires_at: { [Op.gt]: new Date() }
    }
  });
  if (!reset) {
    return res.status(400).json({ message: 'Invalid or expired reset code' });
  }
  user.password_hash = await bcrypt.hash(password, 12);
  await user.save();
  reset.used = true;
  await reset.save();
  res.json({ message: 'Password updated successfully' });
};

const getProfile = async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const profileData = await fetchProfileForUser(user);
  res.json({ user: buildUserResponse(user), profile: profileData });
};

const updateProfile = async (req, res) => {
  const { name, phone, profile } = req.body;
  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (name) user.name = name;
  if (phone) user.phone = phone;
  await user.save();
  
  const profileRecord = await fetchProfileForUser(user);
  if (profileRecord && profile) {
    await profileRecord.update(profile);
  }
  
  res.json({ message: 'Profile updated', user: buildUserResponse(user), profile: profileRecord });
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password are required' });
  }
  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const match = await bcrypt.compare(currentPassword, user.password_hash);
  if (!match) return res.status(403).json({ message: 'Current password is incorrect' });
  user.password_hash = await bcrypt.hash(newPassword, 12);
  await user.save();
  res.json({ message: 'Password changed' });
};

const verifyResetCode = async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ message: 'Email and code required' });
  }
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(404).json({ message: 'User not found' });
  const reset = await PasswordReset.findOne({
    where: {
      user_id: user.id,
      code,
      used: false,
      expires_at: { [Op.gt]: new Date() }
    }
  });
  if (!reset) {
    return res.status(400).json({ message: 'Invalid or expired reset code' });
  }
  res.json({ message: 'Code verified' });
};

module.exports = {
  buildUserResponse,
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword,
  requestEmailChange,
  verifyEmailChange,
  verifyResetCode,
  resendVerificationCode
};
