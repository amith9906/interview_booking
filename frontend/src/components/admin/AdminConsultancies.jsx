import {
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import api from '../../utils/api';

const AdminConsultancies = () => {
  const [consultancies, setConsultancies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creditInputs, setCreditInputs] = useState({});
  const [notes, setNotes] = useState({});
  const [creating, setCreating] = useState(false);
  const [creationError, setCreationError] = useState('');
  const [newConsultancy, setNewConsultancy] = useState({
    name: '',
    email: '',
    password: '',
    credits: ''
  });
  const [selectedConsultancy, setSelectedConsultancy] = useState(null);
  const exportUrl = `${api.defaults.baseURL || ''}/admin/consultancies/analytics/export`;

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/consultancies/analytics');
      setConsultancies(response.data.consultancies || []);
      return response.data.consultancies || [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().then((list) => {
      if (list && list.length) {
        setSelectedConsultancy(list[0]);
      }
    });
  }, []);

  const handleCreditsChange = (hrId, value) => {
    setCreditInputs((prev) => ({ ...prev, [hrId]: value }));
  };

  const handleNotesChange = (hrId, value) => {
    setNotes((prev) => ({ ...prev, [hrId]: value }));
  };

  const addCredits = async (hrId) => {
    const points = Number(creditInputs[hrId]);
    if (!points || points <= 0) return;
    await api.post(`/admin/consultancies/${hrId}/credits`, {
      points,
      note: notes[hrId]
    });
    setCreditInputs((prev) => ({ ...prev, [hrId]: '' }));
    setNotes((prev) => ({ ...prev, [hrId]: '' }));
    await load();
  };

  const toggleActive = async (hr) => {
    await api.patch(`/admin/consultancies/${hr.id}/status`, { active: !hr.active });
    load();
  };

  const handleCreateConsultancy = async () => {
    const { name, email, password, credits } = newConsultancy;
    if (!name || !email || !password) {
      setCreationError('Name, email, and password are required');
      return;
    }
    setCreationError('');
    setCreating(true);
    try {
      await api.post('/admin/users', { name, email, password, role: 'hr' });
      const data = await load();
      const createdHr = data.find((hr) => hr.user?.email === email);
      if (createdHr && Number(credits) > 0) {
        await api.post(`/admin/consultancies/${createdHr.id}/credits`, {
          points: Number(credits),
          note: 'Initial allocation'
        });
        await load();
      }
      setNewConsultancy({ name: '', email: '', password: '', credits: '' });
    } catch (err) {
      setCreationError(err.response?.data?.message || err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Consultancy Analytics & Credits</Typography>
          <Button variant="outlined" size="small" onClick={() => window.open(exportUrl, '_blank')}>
            Export CSV
          </Button>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Track download volume, credit balances, and retain the full transaction history per consultancy.
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, background: 'rgba(255,255,255,0.02)' }}>
          <Typography variant="subtitle1" mb={1}>
            Create new consultancy
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Consultancy name"
                fullWidth
                value={newConsultancy.name}
                onChange={(event) => setNewConsultancy((prev) => ({ ...prev, name: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Admin email"
                fullWidth
                value={newConsultancy.email}
                onChange={(event) => setNewConsultancy((prev) => ({ ...prev, email: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Password"
                type="password"
                fullWidth
                value={newConsultancy.password}
                onChange={(event) => setNewConsultancy((prev) => ({ ...prev, password: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Initial credits"
                type="number"
                fullWidth
                value={newConsultancy.credits}
                onChange={(event) => setNewConsultancy((prev) => ({ ...prev, credits: event.target.value }))}
              />
            </Grid>
          </Grid>
          {creationError && (
            <Typography variant="caption" color="error.main" mt={1}>
              {creationError}
            </Typography>
          )}
          <Button variant="contained" size="small" sx={{ mt: 2 }} onClick={handleCreateConsultancy} disabled={creating}>
            {creating ? 'Creating...' : 'Create consultancy + allocate credits'}
          </Button>
        </Paper>
        {consultancies.map((hr) => (
          <Paper key={hr.id} sx={{ p: 2, borderRadius: 3, background: 'rgba(255,255,255,0.02)' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" spacing={1}>
              <Stack spacing={0.5}>
                <Typography variant="subtitle1">{hr.user?.name || `HR ${hr.id}`}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {hr.user?.email}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={hr.active ? 'Active' : 'Inactive'}
                  color={hr.active ? 'success' : 'warning'}
                  size="small"
                />
                <Button variant="outlined" onClick={() => toggleActive(hr)}>
                  {hr.active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button variant="text" size="small" onClick={() => setSelectedConsultancy(hr)}>
                  View details
                </Button>
              </Stack>
            </Stack>
            <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.08)' }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" color="text.secondary">
                  Credits balance
                </Typography>
                <Typography variant="h5">{hr.credits}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" color="text.secondary">
                  Downloads
                </Typography>
                <Typography variant="h5">{hr.totalDownloads || 0}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Unique resumes: {hr.uniqueResumes}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" color="text.secondary">
                  Credits spent
                </Typography>
                <Typography variant="h5">{hr.creditsSpent}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Credits added: {hr.creditsAdded}
                </Typography>
              </Grid>
            </Grid>
            <Stack spacing={1} mt={2}>
              <Typography variant="body2">Add credits</Typography>
              <Stack spacing={1}>
                <TextField
                  label="Points"
                  type="number"
                  fullWidth
                  value={creditInputs[hr.id] ?? ''}
                  onChange={(event) => handleCreditsChange(hr.id, event.target.value)}
                />
                <TextField
                  label="Notes"
                  fullWidth
                  value={notes[hr.id] ?? ''}
                  onChange={(event) => handleNotesChange(hr.id, event.target.value)}
                />
                <Button size="small" variant="contained" onClick={() => addCredits(hr.id)} disabled={loading}>
                  Save credits
                </Button>
              </Stack>
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2">Recent transactions</Typography>
            <Stack spacing={1} mt={1}>
              {hr.transactions?.map((tx) => (
                <Paper key={tx.id} variant="outlined" sx={{ p: 1, display: 'flex', justifyContent: 'space-between' }}>
                  <Stack>
                    <Typography variant="body2">{tx.type}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {tx.description}
                    </Typography>
                    {tx.resume?.id && (
                      <Typography variant="caption" color="text.secondary">
                        Resume ID {tx.resume.id} · Student {tx.resume.student}
                      </Typography>
                    )}
                  </Stack>
                  <Typography variant="body2">{tx.credits_change}</Typography>
                </Paper>
              ))}
              {!hr.transactions?.length && (
                <Typography variant="caption" color="text.secondary">
                  No transactions yet.
                </Typography>
              )}
            </Stack>
          </Paper>
        ))}
        {!consultancies.length && !loading && (
          <Typography variant="body2" color="text.secondary">
            No consultancies onboarded yet.
          </Typography>
        )}
        {selectedConsultancy && (
          <Paper sx={{ p: 2, borderRadius: 3, background: 'rgba(255,255,255,0.02)' }}>
            <Typography variant="h6" mb={1}>
              Detailed view: {selectedConsultancy.user?.name || `HR ${selectedConsultancy.id}`}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Credits balance
                </Typography>
                <Typography variant="h5">{selectedConsultancy.credits}</Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Downloads
                </Typography>
                <Typography variant="h5">{selectedConsultancy.downloads}</Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Credits spent
                </Typography>
                <Typography variant="h5">{selectedConsultancy.creditsSpent}</Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Credits added
                </Typography>
                <Typography variant="h5">{selectedConsultancy.creditsAdded}</Typography>
              </Grid>
            </Grid>
            <Typography variant="subtitle2" mt={2}>
              Transaction history
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mt: 1, background: 'rgba(255,255,255,0.02)' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Credits</TableCell>
                    <TableCell>Resume / Student</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedConsultancy.transactions?.length ? (
                    selectedConsultancy.transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>{new Date(tx.created_at).toLocaleString()}</TableCell>
                        <TableCell>{tx.type}</TableCell>
                        <TableCell>{tx.description || '-'}</TableCell>
                        <TableCell>{tx.credits}</TableCell>
                        <TableCell>
                          {tx.resume
                            ? `#${tx.resume.id} · ${tx.resume.student || 'unknown'}`
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5}>No activity yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Stack>
    </Paper>
  );
};

export default AdminConsultancies;
