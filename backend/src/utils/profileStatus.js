const PROFILE_STATUS = {
  DRAFT: 'draft',
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

const isNonEmptyArray = (value) => Array.isArray(value) && value.filter(Boolean).length > 0;

const hasResumeFile = (student) => typeof student.resume_file === 'string' && student.resume_file.trim() !== '';

const isStudentProfileComplete = (student) => {
  if (!student) return false;
  const hasExperience = typeof student.experience_years === 'number' && student.experience_years >= 0;
  return (
    hasExperience &&
    isNonEmptyArray(student.projects) &&
    isNonEmptyArray(student.skills) &&
    isNonEmptyArray(student.hobbies) &&
    hasResumeFile(student)
  );
};

const isInterviewerProfileComplete = (interviewer) => {
  if (!interviewer) return false;
  const hasExperience = typeof interviewer.experience_years === 'number' && interviewer.experience_years >= 0;
  return (
    hasExperience &&
    isNonEmptyArray(interviewer.skill_set) &&
    typeof interviewer.bio === 'string' && interviewer.bio.trim() !== ''
  );
};

const determineProfileStatusAfterUpdate = (profile, role) => {
  if (role === 'student') {
    return isStudentProfileComplete(profile) ? PROFILE_STATUS.PENDING_REVIEW : PROFILE_STATUS.DRAFT;
  }
  if (role === 'interviewer') {
    return isInterviewerProfileComplete(profile) ? PROFILE_STATUS.PENDING_REVIEW : PROFILE_STATUS.DRAFT;
  }
  return PROFILE_STATUS.DRAFT;
};

module.exports = {
  PROFILE_STATUS,
  isStudentProfileComplete,
  isInterviewerProfileComplete,
  determineProfileStatusAfterUpdate
};
