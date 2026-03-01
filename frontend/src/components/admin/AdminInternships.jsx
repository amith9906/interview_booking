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
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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

const AdminInternships = () => {
  const [companies, setCompanies] = useState([]);
  const [internships, setInternships] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    company_id: '',
    description: '',
    duration_months: '',
    location: '',
    skills: '',
    published: false
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [internshipDialog, setInternshipDialog] = useState({
    open: false,
    internship: null,
    registrations: [],
    loading: false,
    error: ''
  });

  const loadCompanies = useCallback(async () => {
    try {
      const response = await api.get('/admin/companies');
      setCompanies(response.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadInternships = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/internships');
      setInternships(response.data.internships || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      const response = await api.get('/admin/internships/analytics');
      setAnalytics(response.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadRegistrations = useCallback(async () => {
    try {
      const response = await api.get('/admin/internships/registrations');
      setRegistrations(response.data.registrations || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
    loadInternships();
    loadAnalytics();
    loadRegistrations();
  }, [loadCompanies, loadInternships, loadAnalytics, loadRegistrations]);

  const internshipPartners = companies.filter((company) => company.offers_internships);

  const handleOpenInternshipDialog = async (internshipId) => {
    if (!internshipId) return;
    setInternshipDialog((prev) => ({ ...prev, open: true, loading: true, error: '' }));
    try {
      const response = await api.get(`/admin/internships/${internshipId}/students`);
      setInternshipDialog({
        open: true,
        internship: response.data.internship,
        registrations: response.data.registrations || [],
        loading: false,
        error: ''
      });
    } catch (err) {
      setInternshipDialog((prev) => ({
        ...prev,
        loading: false,
        error: err.response?.data?.message || 'Failed to load registrations'
      }));
    }
  };

  const handleCloseInternshipDialog = () => {
    setInternshipDialog((prev) => ({ ...prev, open: false }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.company_id) {
      setError('Title and company are required');
      return;
    }
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const skills = form.skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean);
      await api.post('/admin/internships', {
        title: form.title,
        company_id: form.company_id,
        description: form.description,
        duration_months: Number(form.duration_months) || undefined,
        location: form.location,
        skills,
        published: form.published
      });
      setMessage('Internship published');
      setForm({
        title: '',
        company_id: '',
        description: '',
        duration_months: '',
        location: '',
        skills: '',
        published: false
      });
      loadInternships();
      loadAnalytics();
      loadRegistrations();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePartner = async () => {
    if (!partnerName.trim()) {
      setError('Company name is required');
      return;
    }
    try {
      await api.post('/admin/companies', {
        name: partnerName.trim(),
        offers_internships: true,
        published: true
      });
      setPartnerName('');
      setMessage('Internship company saved');
      loadCompanies();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const togglePartnerInternship = async (company) => {
    try {
      await api.patch(`/admin/companies/${company.id}`, {
        offers_internships: !company.offers_internships
      });
      loadCompanies();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePublish = async (internship) => {
    try {
      await api.patch(`/admin/internships/${internship.id}/publish`, {
        published: !internship.published
      });
      loadInternships();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6" mb={2}>
          Internship programs
        </Typography>
        <Stack spacing={2} mb={3}>
          {message && <Alert severity="success">{message}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Title"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Company</InputLabel>
                <Select
                  value={form.company_id}
                  label="Company"
                  onChange={(event) => setForm((prev) => ({ ...prev, company_id: event.target.value }))}
                  sx={{ minWidth: 200 }}
                >
                  {!internshipPartners.length && (
                    <MenuItem value="" disabled>
                      Add an internship company first
                    </MenuItem>
                  )}
                  {internshipPartners.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Duration (months)"
                type="number"
                value={form.duration_months}
                onChange={(event) => setForm((prev) => ({ ...prev, duration_months: event.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Location"
                value={form.location}
                onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Visibility</InputLabel>
                <Select
                  value={form.published ? 'published' : 'draft'}
                  label="Visibility"
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, published: event.target.value === 'published' }))
                  }
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                </Select>
              </FormControl>
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
            <Grid item xs={12}>
              <TextField
                label="Skills (comma separated)"
                value={form.skills}
                onChange={(event) => setForm((prev) => ({ ...prev, skills: event.target.value }))}
                fullWidth
              />
            </Grid>
          </Grid>
          <Stack spacing={2} mb={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-end">
              <TextField
                label="New internship company"
                value={partnerName}
                onChange={(event) => setPartnerName(event.target.value)}
                fullWidth
              />
              <Button variant="outlined" onClick={handleCreatePartner} disabled={!partnerName.trim()}>
                Save partner
              </Button>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {companies.map((company) => (
                <Chip
                  key={company.id}
                  label={`${company.name} ${company.offers_internships ? '· accepts interns' : '· hidden'}`}
                  color={company.offers_internships ? 'primary' : 'default'}
                  variant={company.offers_internships ? 'filled' : 'outlined'}
                  onClick={() => togglePartnerInternship(company)}
                />
              ))}
            </Stack>
          </Stack>
          <Typography variant="subtitle2" color="text.secondary">
            Partner companies display at the top when you pick an internship host.
          </Typography>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Posting…' : 'Create internship'}
          </Button>
        </Stack>
        <Divider />
        <Typography variant="subtitle1" mt={3}>
          Analytics
        </Typography>
        <Stack spacing={1} mt={1}>
          {analytics && (
            <Typography variant="body2" color="text.secondary">
              Total internship registrations: {analytics.totalRegistrations}
            </Typography>
          )}
          {analytics?.internships?.map((internship) => (
            <Box key={internship.id} display="flex" justifyContent="space-between">
              <Typography variant="body2" sx={{ flex: 1 }}>
                {internship.title} · {internship.company}
              </Typography>
              <Chip label={`${internship.registrations} registrations`} size="small" />
            </Box>
          ))}
        </Stack>
        <Stack spacing={2} mt={3}>
          {internships.map((internship) => (
            <Paper
              key={internship.id}
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Stack spacing={0.5}>
                  <Button
                    variant="text"
                    onClick={() => handleOpenInternshipDialog(internship.id)}
                    sx={{ textTransform: 'none', p: 0, minWidth: 0 }}
                  >
                    <Typography variant="subtitle1" sx={{ textAlign: 'left' }}>
                      {internship.title}
                    </Typography>
                  </Button>
                  <Typography variant="body2" color="text.secondary">
                    {internship.company} · {internship.duration_months || 'Flexible'} months
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleOpenInternshipDialog(internship.id)}
                  >
                    View students
                  </Button>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => handleTogglePublish(internship)}
                  >
                    {internship.published ? 'Hide' : 'Publish'}
                  </Button>
                </Stack>
              </Stack>
              <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                <Chip label={`${internship.registrations} students`} size="small" />
                <Chip
                  label={internship.published ? 'Published' : 'Draft'}
                  variant="outlined"
                  size="small"
                />
              </Stack>
            </Paper>
          ))}
          {!internships.length && !loading && (
            <Typography variant="body2" color="text.secondary">
              No internships created yet.
            </Typography>
          )}
        </Stack>
        <Dialog
          open={internshipDialog.open}
          onClose={handleCloseInternshipDialog}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>
            {internshipDialog.internship ? internshipDialog.internship.title : 'Internship students'}
          </DialogTitle>
          <DialogContent dividers>
            {internshipDialog.loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {internshipDialog.error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {internshipDialog.error}
                  </Alert>
                )}
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {internshipDialog.internship?.company || '—'} ·{' '}
                  {internshipDialog.internship?.location || 'Location TBD'}
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
                      <TableCell>Desired skills</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {internshipDialog.registrations.length ? (
                      internshipDialog.registrations.map((entry) => {
                        const student = entry.student;
                        const desired = entry.desired_skills || [];
                        return (
                          <TableRow key={`internship-reg-${entry.id}`}>
                            <TableCell>{student?.name || '—'}</TableCell>
                            <TableCell>{student?.email || '—'}</TableCell>
                            <TableCell>{student?.phone || '—'}</TableCell>
                            <TableCell>{student?.location || '—'}</TableCell>
                            <TableCell>{(student?.skills || []).join(', ') || '—'}</TableCell>
                            <TableCell>{student?.experience_years ?? '—'}</TableCell>
                            <TableCell>{desired.join(', ') || '—'}</TableCell>
                            <TableCell>{entry.status || '—'}</TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
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
        <Divider sx={{ my: 3 }} />
        <Typography variant="subtitle1" mb={1}>
          Recent registrations
        </Typography>
        <Stack spacing={1}>
          {registrations.map((registration) => (
            <Paper
              key={registration.id}
              variant="outlined"
              sx={{ p: 2, background: 'rgba(255,255,255,0.02)', borderRadius: 2 }}
            >
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">
                  {registration.student} · {registration.internship}
                </Typography>
                <Chip label={registration.status} size="small" />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Skills: {registration.desired_skills.join(', ') || '—'} · Purpose: {registration.purpose || '—'}
              </Typography>
            </Paper>
          ))}
          {!registrations.length && (
            <Typography variant="body2" color="text.secondary">
              No internship registrations yet.
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default AdminInternships;
