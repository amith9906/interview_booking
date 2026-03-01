import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import api from '../../utils/api';

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    level: '',
    duration_weeks: '',
    description: '',
    published: true,
    instructor_name: '',
    instructor_title: '',
    instructor_email: '',
    instructor_bio: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [courseDialog, setCourseDialog] = useState({
    open: false,
    course: null,
    registrations: [],
    loading: false,
    error: ''
  });

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/courses');
      setCourses(response.data.courses || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      const response = await api.get('/admin/courses/analytics');
      setAnalytics(response.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadCourses();
    loadAnalytics();
  }, [loadCourses, loadAnalytics]);

  const handleOpenCourseDialog = async (courseId) => {
    if (!courseId) return;
    setCourseDialog((prev) => ({ ...prev, open: true, loading: true, error: '' }));
    try {
      const response = await api.get(`/admin/courses/${courseId}/students`);
      setCourseDialog({
        open: true,
        course: response.data.course,
        registrations: response.data.registrations || [],
        loading: false,
        error: ''
      });
    } catch (err) {
      setCourseDialog((prev) => ({
        ...prev,
        loading: false,
        error: err.response?.data?.message || 'Failed to load registrations'
      }));
    }
  };

  const handleCloseCourseDialog = () => {
    setCourseDialog((prev) => ({ ...prev, open: false }));
  };

  const handleSubmit = async () => {
    if (!form.name) {
      setError('Course name is required');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.post('/admin/courses', {
        ...form,
        duration_weeks: Number(form.duration_weeks) || undefined
      });
      setMessage('Course created successfully');
      setForm({
        name: '',
        level: '',
        duration_weeks: '',
        description: '',
        published: true,
        instructor_name: '',
        instructor_title: '',
        instructor_email: '',
        instructor_bio: ''
      });
      loadCourses();
      loadAnalytics();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (course) => {
    try {
      await api.patch(`/admin/courses/${course.id}/publish`, {
        published: !course.published
      });
      loadCourses();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6" mb={2}>
          Course catalog
        </Typography>
        <Stack spacing={2} mb={3}>
          {message && <Alert severity="success">{message}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Course name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Level"
                value={form.level}
                onChange={(event) => setForm((prev) => ({ ...prev, level: event.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Duration (weeks)"
                type="number"
                value={form.duration_weeks}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, duration_weeks: event.target.value }))
                }
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Instructor name"
                value={form.instructor_name}
                onChange={(event) => setForm((prev) => ({ ...prev, instructor_name: event.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Instructor title"
                value={form.instructor_title}
                onChange={(event) => setForm((prev) => ({ ...prev, instructor_title: event.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Instructor email"
                type="email"
                value={form.instructor_email}
                onChange={(event) => setForm((prev) => ({ ...prev, instructor_email: event.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Instructor bio"
                value={form.instructor_bio}
                onChange={(event) => setForm((prev) => ({ ...prev, instructor_bio: event.target.value }))}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Create course'}
            </Button>
            <Button
              variant="outlined"
              onClick={() =>
                setForm((prev) => ({ ...prev, published: !prev.published }))
              }
            >
              Set as {form.published ? 'Draft' : 'Live'}
            </Button>
          </Stack>
        </Stack>
        <Divider />
        <Typography variant="subtitle1" mt={3}>
          Registrations
        </Typography>
        <Stack spacing={1} mt={2}>
          {analytics && (
            <Typography variant="body2" color="text.secondary">
              Total enrollments in date range: {analytics.totalRegistrations}
            </Typography>
          )}
          {analytics?.courses?.map((course) => (
            <Box key={course.id} display="flex" justifyContent="space-between">
              <Typography variant="body2" sx={{ flex: 1 }}>
                {course.name} · {course.level}
              </Typography>
              <Chip label={`${course.registrations} registrations`} size="small" />
            </Box>
          ))}
        </Stack>
        <Stack spacing={2} mt={3}>
          {courses.map((course) => (
            <Box
              key={course.id}
              sx={{
                p: 2,
                borderRadius: 2,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Button
                    variant="text"
                    onClick={() => handleOpenCourseDialog(course.id)}
                    sx={{ textTransform: 'none', p: 0, minWidth: 0 }}
                  >
                    <Typography variant="subtitle1" sx={{ textAlign: 'left' }}>
                      {course.name}
                    </Typography>
                  </Button>
                  <Typography variant="body2" color="text.secondary">
                    {course.level} · {course.duration_weeks} weeks
                  </Typography>
                  {course.instructor && (
                    <>
                      <Typography variant="body2" color="text.secondary">
                        Instructor: {course.instructor.name}
                        {course.instructor.title ? ` · ${course.instructor.title}` : ''}
                        {course.instructor.email ? ` · ${course.instructor.email}` : ''}
                      </Typography>
                      {course.instructor.bio && (
                        <Typography variant="caption" color="text.secondary">
                          {course.instructor.bio}
                        </Typography>
                      )}
                    </>
                  )}
                </Box>
                <Button
                  variant="text"
                  onClick={() => handleTogglePublish(course)}
                  size="small"
                >
                  {course.published ? 'Unpublish' : 'Publish'}
                </Button>
              </Stack>
              <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" alignItems="center">
                <Chip label={`${course.registrations} students`} size="small" />
                <Chip
                  label={course.published ? 'Published' : 'Draft'}
                  size="small"
                  variant="outlined"
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleOpenCourseDialog(course.id)}
                >
                  View students
                </Button>
              </Stack>
            </Box>
          ))}
          {!courses.length && !loading && (
            <Typography variant="body2" color="text.secondary">
              No courses defined yet.
            </Typography>
          )}
        </Stack>
        <Dialog
          open={courseDialog.open}
          onClose={handleCloseCourseDialog}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>
            {courseDialog.course ? courseDialog.course.name : 'Course students'}
          </DialogTitle>
          <DialogContent dividers>
            {courseDialog.loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {courseDialog.error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {courseDialog.error}
                  </Alert>
                )}
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {courseDialog.course?.level || 'Level unknown'} ·{' '}
                  {courseDialog.course?.description || 'No description'}
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Student</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Skills</TableCell>
                      <TableCell>Experience</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {courseDialog.registrations.length ? (
                      courseDialog.registrations.map((entry) => {
                        const student = entry.student;
                        return (
                          <TableRow key={`course-reg-${entry.id}`}>
                            <TableCell>{student?.name || '—'}</TableCell>
                            <TableCell>{student?.email || '—'}</TableCell>
                            <TableCell>{student?.phone || '—'}</TableCell>
                            <TableCell>{student?.location || '—'}</TableCell>
                            <TableCell>
                              {(student?.skills || []).join(', ') || '—'}
                            </TableCell>
                            <TableCell>{student?.experience_years ?? '—'}</TableCell>
                            <TableCell>{entry.status || '—'}</TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          No registrations yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AdminCourses;
