const fs = require('fs');
const path = require('path');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { Student, Resume } = require('../models');
const { isStudentProfileComplete, PROFILE_STATUS } = require('../utils/profileStatus');

const upload = multer({ storage: multer.memoryStorage() });

const sanitizeSegment = (value) => {
  if (!value) return '';
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '_')
    .replace(/__+/g, '_')
    .replace(/^_|_$/g, '');
};

const ensureStudentDir = async (studentFolder) => {
  const localDir = path.join(process.cwd(), 'uploads', 'resumes', studentFolder);
  await fs.promises.mkdir(localDir, { recursive: true });
  return localDir;
};

const extractResumeData = async (buffer) => {
  try {
    const data = await pdfParse(buffer);
    const text = data.text;
    const lowerText = text.toLowerCase();
    
    let experience_years = null;
    const expMatch = lowerText.match(/(\d+)\+?\s*(?:year|yr)s?\s*(?:of\s*)?(?:experience|exp)/);
    if (expMatch) experience_years = parseInt(expMatch[1], 10);
    
    // Tech keywords
    const commonSkills = [
      'javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin', 'go', 'rust',
      'react', 'node.js', 'node', 'express', 'angular', 'vue', 'django', 'flask', 'spring', 'next.js',
      'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'cassandra',
      'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'terraform', 'jenkins', 'gitlab ci',
      'html', 'css', 'sass', 'less', 'git', 'typescript', 'linux', 'bash', 'graphql', 'rest api'
    ];
    const foundSkills = commonSkills.filter(skill => {
        // escape dot for regex
        const escaped = skill.replace(/\./g, '\\.');
        const regex = new RegExp(`\\b${escaped}\\b`);
        return regex.test(lowerText);
    });
    // capitalized versions
    const skills = foundSkills.map(s => s === 'node' ? 'Node.js' : s.charAt(0).toUpperCase() + s.slice(1)).join(', ');
    
    // Basic project extraction
    let projects = '';
    const projIdx = lowerText.indexOf('projects\n');
    if (projIdx !== -1) {
        projects = text.substring(projIdx + 9, projIdx + 300).trim().split('\n').filter(l => l.trim().length > 0).slice(0, 3).join('\n');
    } else if (lowerText.indexOf('projects') !== -1) {
         const fallbackIdx = lowerText.indexOf('projects');
         projects = text.substring(fallbackIdx + 8, fallbackIdx + 300).trim().split('\n').filter(l => l.trim().length > 0).slice(0, 3).join('\n');
    }
    
    return { experience_years, skills, projects };
  } catch (err) {
    console.error('Error parsing PDF:', err);
    return null;
  }
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIMETYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

const uploadResume = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Resume file required' });
  if (req.user.role !== 'student') return res.status(403).json({ message: 'Only students can upload resumes' });

  // File size validation
  if (req.file.size > MAX_FILE_SIZE) {
    return res.status(400).json({ message: 'File size exceeds 5MB limit' });
  }

  // File type validation
  if (!ALLOWED_MIMETYPES.includes(req.file.mimetype)) {
    return res.status(400).json({ message: 'Invalid file type. Only PDF and Word docs are allowed.' });
  }

  const student = await Student.findOne({ where: { user_id: req.user.id } });
  if (!student) return res.status(404).json({ message: 'Student profile missing' });
  const buffer = req.file.buffer;

  let extractedData = null;
  if (req.file.mimetype === 'application/pdf') {
    extractedData = await extractResumeData(buffer);
  }

  const studentName = sanitizeSegment(req.user.name || req.user.email || `student-${student.id}`);
  const studentFolder = `${student.id}-${studentName || 'student'}`;
  const localDir = await ensureStudentDir(studentFolder);
  const sanitizedName = req.file.originalname.replace(/[^\w.-]/g, '_');
  const localPath = path.join(localDir, sanitizedName);
  await fs.promises.writeFile(localPath, buffer);
  const fileUrl = path.posix.join('uploads', 'resumes', studentFolder, sanitizedName);

  await Resume.create({ student_id: student.id, file_path: fileUrl });
  student.resume_file = fileUrl;
  student.profile_status = isStudentProfileComplete(student) ? PROFILE_STATUS.PENDING_REVIEW : PROFILE_STATUS.DRAFT;
  student.profile_rejected_reason = null;
  student.profile_submitted_at = student.profile_status === PROFILE_STATUS.PENDING_REVIEW ? new Date() : null;
  await student.save();

  res.json({ url: fileUrl, local: true, extractedData });
};

module.exports = { upload, uploadResume };
