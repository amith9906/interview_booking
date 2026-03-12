import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';

const resourceTypes = ['pdf', 'ppt', 'link', 'video', 'other'];

const AdminResources = () => {
  const [resources, setResources] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    resource_type: 'pdf',
    link: '',
    file_url: '',
    student_ids: []
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [assignPending, setAssignPending] = useState({});
  const [resourceActionLoading, setResourceActionLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const loadStudents = useCallback(async () => {
    const response = await api.get('/admin/users/list');
    setStudents(response.data.students || []);
  }, []);

  const loadResources = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/resources');
      setResources(response.data.resources || []);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAssignments = useCallback(async () => {
    const response = await api.get('/admin/resources/assignments');
    setAssignments(response.data.assignments || []);
  }, []);

  useEffect(() => {
    loadStudents();
    loadResources();
    loadAssignments();
  }, [loadStudents, loadResources, loadAssignments]);

  const isFileType = ['pdf', 'ppt'].includes(form.resource_type);

  const handleCreate = async () => {
    if (!form.title) {
      setError('Title is required');
      return;
    }
    setError('');
    setMessage('');
    setSaving(true);
    try {
      let payload;
      let headers = {};
      if (isFileType && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', form.title);
        if (form.description) formData.append('description', form.description);
        formData.append('resource_type', form.resource_type);
        if (form.link) formData.append('link', form.link);
        if (form.student_ids.length) formData.append('student_ids', JSON.stringify(form.student_ids));
        payload = formData;
        headers = { 'Content-Type': 'multipart/form-data' };
      } else {
        payload = form;
      }
      await api.post('/admin/resources', payload, { headers });
      setMessage('Resource created and shared');
      setForm({ title: '', description: '', resource_type: 'pdf', link: '', file_url: '', student_ids: [] });
      setSelectedFile(null);
      loadResources();
      loadAssignments();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async (resourceId) => {
    const studentIds = assignPending[resourceId] || [];
    if (!studentIds.length) {
      setError('Select at least one student to assign');
      return;
    }
    try {
      await api.post(`/admin/resources/${resourceId}/assign`, { student_ids: studentIds });
      loadAssignments();
      setMessage('Resource shared with selected students');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handlePublishToHr = async (resource) => {
    setError('');
    setMessage('');
    setResourceActionLoading(true);
    try {
      await api.patch(`/admin/resources/${resource.id}/publish-hr`, {
        publish: !resource.visible_to_hr
      });
      setMessage(
        `Resource marked as ${resource.visible_to_hr ? 'hidden from' : 'visible to'} HR members.`
      );
      loadResources();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setResourceActionLoading(false);
    }
  };

  const handleDownloadResource = async (resource) => {
    setError('');
    setMessage('');
    try {
      const response = await api.get(`/admin/resources/${resource.id}/download`);
      const url = response.data.url;
      if (url) {
        window.open(url, '_blank');
      }
      setMessage(`Opened ${response.data.title || resource.title}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const studentsById = useMemo(
    () =>
      students.reduce((acc, student) => {
        acc[student.id] = student;
        return acc;
      }, {}),
    [students]
  );

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6" mb={1}>
          Share resources
        </Typography>
        {message && <Alert severity="success">{message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        <Stack spacing={2} mb={2}>
          <TextField
            label="Title"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            fullWidth
          />
          <TextField
            label="Description"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            fullWidth
            multiline
            rows={2}
          />
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Resource type</InputLabel>
              <Select
                value={form.resource_type}
                label="Resource type"
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, resource_type: event.target.value }));
                  setSelectedFile(null);
                }}
              >
                {resourceTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Link"
              value={form.link}
              onChange={(event) => setForm((prev) => ({ ...prev, link: event.target.value }))}
              fullWidth
            />
          </Stack>
          {isFileType ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <Button component="label" variant="outlined">
                {selectedFile ? selectedFile.name : `Upload ${form.resource_type.toUpperCase()} file`}
                <input
                  type="file"
                  hidden
                  accept={form.resource_type === 'pdf' ? '.pdf' : '.ppt,.pptx'}
                  onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                />
              </Button>
              {selectedFile && (
                <Typography variant="caption" color="text.secondary">
                  {(selectedFile.size / 1024).toFixed(0)} KB
                </Typography>
              )}
            </Stack>
          ) : (
            <TextField
              label="File URL"
              value={form.file_url}
              onChange={(event) => setForm((prev) => ({ ...prev, file_url: event.target.value }))}
              helperText="Paste a direct URL to the file"
              fullWidth
            />
          )}
          <FormControl fullWidth>
            <InputLabel>Students</InputLabel>
            <Select
              multiple
              value={form.student_ids}
              label="Students"
              onChange={(event) => setForm((prev) => ({ ...prev, student_ids: event.target.value }))}
              renderValue={(selected) =>
                selected.length ? selected.map((id) => studentsById[id]?.name || id).join(', ') : 'Pick students'
              }
            >
              {students.map((student) => (
                <MenuItem key={student.id} value={student.id}>
                  <Checkbox checked={form.student_ids.includes(student.id)} />
                  <ListItemText primary={student.name} secondary={student.email} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={handleCreate} disabled={saving}>
            {saving ? 'Sharing…' : 'Create & Share'}
          </Button>
        </Stack>
        <Divider />
        <Typography variant="subtitle1" mt={2}>
          Existing resources
        </Typography>
        <Stack spacing={2} mt={1}>
          {resources.map((resource) => (
            <Paper
              key={resource.id}
              variant="outlined"
              sx={{ p: 2, borderRadius: 2, background: 'rgba(255,255,255,0.02)' }}
            >
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1">{resource.title}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={resource.resource_type.toUpperCase()} size="small" />
                    <Chip
                      label={resource.visible_to_hr ? 'HR-visible' : 'Hidden from HR'}
                      size="small"
                      color={resource.visible_to_hr ? 'success' : 'default'}
                    />
                  </Stack>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Shared by {resource.creator?.name || 'Admin'} · {resource.assignments?.length || 0}{' '}
                  students
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button
                    variant="text"
                    onClick={() => handleAssign(resource.id)}
                    disabled={!assignPending[resource.id]?.length}
                  >
                    Share with selected
                  </Button>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Assign to students</InputLabel>
                    <Select
                      multiple
                      value={assignPending[resource.id] || []}
                      label="Assign to students"
                      onChange={(event) =>
                        setAssignPending((prev) => ({ ...prev, [resource.id]: event.target.value }))
                      }
                      renderValue={(selected) =>
                        selected.length
                          ? selected.map((id) => studentsById[id]?.name || id).join(', ')
                          : 'Pick students'
                      }
                    >
                      {students.map((student) => (
                        <MenuItem key={student.id} value={student.id}>
                          <Checkbox checked={(assignPending[resource.id] || []).includes(student.id)} />
                          <ListItemText primary={student.name} secondary={student.email} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
                <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                  <Button size="small" variant="outlined" onClick={() => handleDownloadResource(resource)}>
                    Download
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handlePublishToHr(resource)}
                    disabled={resourceActionLoading}
                  >
                    {resource.visible_to_hr ? 'Hide from HR' : 'Publish to HR'}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ))}
          {!resources.length && !loading && (
            <Typography variant="body2" color="text.secondary">
              No shared resources yet.
            </Typography>
          )}
        </Stack>
        <Divider sx={{ my: 3 }} />
        <Typography variant="subtitle1">Assignment log</Typography>
        <Stack spacing={1} mt={1}>
          {assignments.map((assignment) => (
            <Paper
              key={`${assignment.student}-${assignment.resource}-${assignment.assigned_at}`}
              variant="outlined"
              sx={{ p: 1.5, borderRadius: 2, background: 'rgba(255,255,255,0.02)' }}
            >
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">
                  {assignment.student} · {assignment.resource}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(assignment.assigned_at).toLocaleString()}
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Shared by {assignment.creator || 'admin'}
              </Typography>
            </Paper>
          ))}
          {!assignments.length && (
            <Typography variant="body2" color="text.secondary">
              No assignment activity yet.
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default AdminResources;
