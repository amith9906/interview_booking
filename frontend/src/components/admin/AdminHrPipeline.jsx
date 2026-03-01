import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  Grid,
  MenuItem,
  Select,
  Stack,
  Typography
} from '@mui/material';
import api from '../../utils/api';

const stageConfig = [
  { id: 'shortlisted', title: 'Shortlisted', description: 'Resume marketplace / HR shortlist' },
  { id: 'interviewing', title: 'Interviewing', description: 'Interview slots booked / feedback pending' },
  { id: 'offered', title: 'Offered', description: 'Offers delivered to the candidate' },
  { id: 'rejected', title: 'Rejected', description: 'Candidate rejected or withdrawn' }
];

const AdminHrPipeline = () => {
  const [pipeline, setPipeline] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadPipeline = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const response = await api.get('/admin/hr/pipeline');
      setPipeline(response.data.columns || {});
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPipeline();
  }, [loadPipeline]);

  const handleStageChange = async (studentId, stage) => {
    try {
      await api.patch(`/admin/hr/pipeline/${studentId}`, { stage });
      loadPipeline();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const renderRow = (student) => (
    <Box
      key={`student-${student.id}`}
      sx={{
        p: 2,
        mb: 1,
        borderRadius: 2,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)'
      }}
    >
      <Stack spacing={0.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography fontWeight="600">{student.name}</Typography>
            <Typography fontSize="0.8rem" color="text.secondary">
              {student.email}
            </Typography>
          </Box>
          <Chip label={`${student.bookings} bookings`} size="small" />
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {student.skills?.slice(0, 3).join(', ') || 'No skills'}
        </Typography>
        <FormControl size="small" fullWidth>
          <Select
            value={student.profileStage ?? 'shortlisted'}
            onChange={(event) => handleStageChange(student.id, event.target.value)}
          >
            {stageConfig.map((stage) => (
              <MenuItem key={`${student.id}-${stage.id}`} value={stage.id}>
                {stage.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </Box>
  );

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          HR Recruitment Pipeline
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {loading ? (
          <Typography variant="body2">Loading pipeline…</Typography>
        ) : (
          <Grid container spacing={2} mt={1}>
            {stageConfig.map((stage) => (
              <Grid item xs={12} md={6} lg={3} key={`column-${stage.id}`}>
                <Typography variant="subtitle1" fontWeight="600">
                  {stage.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stage.description}
                </Typography>
                <Divider sx={{ my: 1 }} />
                {pipeline[stage.id]?.length ? (
                  pipeline[stage.id].map((student) => (
                    <div key={`${stage.id}-${student.id}`}>{renderRow({ ...student, profileStage: stage.id })}</div>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No candidates yet.
                  </Typography>
                )}
              </Grid>
            ))}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminHrPipeline;
