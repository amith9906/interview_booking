const { Resource, StudentResource, Student, User, ResourceAudit } = require('../models');
const multer = require('multer');
const { buildResourceKey, uploadToS3, getPresignedUrl } = require('../services/s3Service');

const resourceUpload = multer({ storage: multer.memoryStorage() });

const FILE_TYPES = ['pdf', 'ppt'];
const ALLOWED_MIMETYPES = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
];
const isS3Key = (value) => value && !value.startsWith('http');

const assignResource = async (resourceId, studentIds = [], performedByUserId = null) => {
  const ids = [...new Set(studentIds.filter(Boolean))];
  if (!ids.length) return 0;
  const students = await Student.findAll({ where: { id: ids }, attributes: ['id'] });
  const validIds = students.map((student) => student.id);
  if (!validIds.length) return 0;
  await Promise.all(
    validIds.map(async (studentId) => {
      await StudentResource.findOrCreate({
        where: { resource_id: resourceId, student_id: studentId }
      });
      await ResourceAudit.create({
        resource_id: resourceId,
        student_id: studentId,
        performed_by_user_id: performedByUserId,
        action: 'assigned',
        details: 'Assigned resource via admin interface'
      });
    })
  );
  return validIds.length;
};

const createResource = async (req, res) => {
  const {
    title,
    description,
    link,
    file_url: bodyFileUrl,
    resource_type = 'other',
    visible_to_hr = false
  } = req.body;

  // student_ids may arrive as comma-separated string or JSON array from FormData
  let student_ids = [];
  if (req.body.student_ids) {
    if (Array.isArray(req.body.student_ids)) {
      student_ids = req.body.student_ids.map(Number).filter(Boolean);
    } else {
      try {
        const parsed = JSON.parse(req.body.student_ids);
        student_ids = Array.isArray(parsed) ? parsed.map(Number).filter(Boolean) : [];
      } catch {
        student_ids = String(req.body.student_ids).split(',').map(Number).filter(Boolean);
      }
    }
  }

  if (!title) return res.status(400).json({ message: 'Title is required' });

  let file_url = bodyFileUrl || null;

  if (req.file) {
    if (!ALLOWED_MIMETYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ message: 'Only PDF and PPT files are allowed' });
    }
    const sanitizedFilename = req.file.originalname.replace(/[^\w.-]/g, '_');
    const s3Key = buildResourceKey(sanitizedFilename);
    await uploadToS3(req.file.buffer, s3Key, req.file.mimetype);
    file_url = s3Key;
  }

  const resource = await Resource.create({
    title,
    description,
    link,
    file_url,
    resource_type,
    visible_to_hr: visible_to_hr === true || visible_to_hr === 'true',
    created_by_user_id: req.user.id,
    created_by_role: req.user.role
  });
  if (student_ids.length) {
    await assignResource(resource.id, student_ids, req.user.id);
  }
  res.status(201).json(resource);
};

const assignResourceToStudents = async (req, res) => {
  const { id } = req.params;
  const { student_ids = [] } = req.body;
  const resource = await Resource.findByPk(id);
  if (!resource) return res.status(404).json({ message: 'Resource not found' });
  const assignedCount = await assignResource(resource.id, student_ids, req.user.id);
  res.json({ message: 'Assigned', assigned: assignedCount });
};

const listResources = async (req, res) => {
  const where = {};
  if (req.user.role === 'interviewer') {
    where.created_by_user_id = req.user.id;
  }
  const resources = await Resource.findAll({
    where,
    include: [
      {
        model: StudentResource,
        as: 'Assignments',
        include: [{ model: Student, as: 'Student', include: [{ model: User, attributes: ['id', 'name', 'email'] }] }]
      },
      {
        model: User,
        as: 'Creator',
        attributes: ['id', 'name', 'email']
      }
    ],
    order: [['created_at', 'DESC']]
  });
  res.json({
    resources: resources.map((resource) => ({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      link: resource.link,
      file_url: resource.file_url,
      resource_type: resource.resource_type,
      created_by_role: resource.created_by_role,
      visible_to_hr: resource.visible_to_hr,
      creator: resource.Creator,
      assignments: resource.Assignments?.map((assignment) => ({
        student: assignment.Student?.User?.name,
        email: assignment.Student?.User?.email,
        student_id: assignment.student_id
      })) || [],
      created_at: resource.created_at
    }))
  });
};

const downloadResource = async (req, res) => {
  const { id } = req.params;
  const resource = await Resource.findByPk(id);
  if (!resource) return res.status(404).json({ message: 'Resource not found' });
  let url = resource.link || null;
  if (resource.file_url) {
    url = isS3Key(resource.file_url) ? await getPresignedUrl(resource.file_url) : resource.file_url;
  }
  if (!url) {
    return res.status(400).json({ message: 'No download URL available for this resource' });
  }
  res.json({
    url,
    title: resource.title,
    description: resource.description,
    resource_type: resource.resource_type,
    visible_to_hr: resource.visible_to_hr
  });
};

const downloadStudentResource = async (req, res) => {
  const { id } = req.params;
  const student = await Student.findOne({ where: { user_id: req.user.id } });
  if (!student) return res.status(404).json({ message: 'Student profile missing' });

  const assignment = await StudentResource.findOne({
    where: { resource_id: id, student_id: student.id }
  });
  if (!assignment) return res.status(403).json({ message: 'Access denied' });

  const resource = await Resource.findByPk(id);
  if (!resource) return res.status(404).json({ message: 'Resource not found' });

  let url = resource.link || null;
  if (resource.file_url) {
    url = isS3Key(resource.file_url) ? await getPresignedUrl(resource.file_url) : resource.file_url;
  }
  if (!url) return res.status(400).json({ message: 'No file available for this resource' });

  res.json({ url, title: resource.title, resource_type: resource.resource_type });
};

const publishResourceToHr = async (req, res) => {
  const { id } = req.params;
  const { publish = true } = req.body;
  const resource = await Resource.findByPk(id);
  if (!resource) return res.status(404).json({ message: 'Resource not found' });
  resource.visible_to_hr = Boolean(publish);
  await resource.save();
  await ResourceAudit.create({
    resource_id: resource.id,
    action: 'publish_to_hr',
    performed_by_user_id: req.user.id,
    details: publish ? 'Published to HR portal' : 'Removed from HR view'
  });
  res.json({ resource });
};

const listAssignments = async (req, res) => {
  const assignments = await StudentResource.findAll({
    include: [
      {
        model: Student,
        as: 'Student',
        include: [{ model: User, attributes: ['id', 'name', 'email'] }]
      },
      {
        model: Resource,
        as: 'Resource',
        include: [{ model: User, as: 'Creator', attributes: ['name'] }]
      }
    ],
    order: [['assigned_at', 'DESC']],
    limit: 200
  });
  res.json({
    assignments: assignments.map((assignment) => ({
      student: assignment.Student?.User?.name,
      email: assignment.Student?.User?.email,
      resource: assignment.Resource?.title,
      creator: assignment.Resource?.Creator?.name,
      assigned_at: assignment.assigned_at
    }))
  });
};

const listStudentResources = async (req, res) => {
  const student = await Student.findOne({ where: { user_id: req.user.id } });
  if (!student) return res.status(404).json({ message: 'Student profile missing' });
  const assignments = await StudentResource.findAll({
    where: { student_id: student.id },
    include: [{ model: Resource, as: 'Resource', include: [{ model: User, as: 'Creator', attributes: ['id', 'name'] }] }],
    order: [['assigned_at', 'DESC']]
  });
  res.json({
    resources: assignments.map((assignment) => ({
      id: assignment.Resource?.id,
      title: assignment.Resource?.title,
      description: assignment.Resource?.description,
      link: assignment.Resource?.link,
      file_url: assignment.Resource?.file_url,
      resource_type: assignment.Resource?.resource_type,
      creator: assignment.Resource?.Creator?.name,
      assigned_at: assignment.assigned_at
    }))
  });
};

const listResourceAudits = async (req, res) => {
  const audits = await ResourceAudit.findAll({
    include: [
      { model: Resource, attributes: ['id', 'title'] },
      { model: Student, include: [{ model: User, attributes: ['id', 'name', 'email'] }] },
      { model: User, as: 'PerformedByUser', attributes: ['id', 'name', 'email'] }
    ],
    order: [['created_at', 'DESC']],
    limit: 200
  });
  res.json({
    audits: audits.map((audit) => ({
      id: audit.id,
      resource: audit.Resource?.title,
      student: audit.Student?.User?.name,
      student_email: audit.Student?.User?.email,
      performed_by: audit.PerformedByUser?.name,
      action: audit.action,
      details: audit.details,
      created_at: audit.created_at
    }))
  });
};

module.exports = {
  createResource,
  assignResourceToStudents,
  listResources,
  listAssignments,
  downloadResource,
  publishResourceToHr,
  listStudentResources,
  listResourceAudits,
  downloadStudentResource,
  resourceUpload
};
