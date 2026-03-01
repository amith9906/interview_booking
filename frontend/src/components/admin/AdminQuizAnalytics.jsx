import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Card, CardContent, CircularProgress, Divider, Stack, Typography } from '@mui/material';
import api from '../../utils/api';

const AdminQuizAnalytics = () => {
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadKpi = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/quizzes/kpi');
      setKpi(response.data || null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKpi();
  }, [loadKpi]);

  return (
    <Card variant="outlined" sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Quiz automation KPIs
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {loading ? (
          <CircularProgress />
        ) : kpi ? (
          <>
            <Stack direction="row" spacing={3} flexWrap="wrap" mb={2}>
              <Typography variant="body2">Live quizzes: {kpi.totalQuizzes}</Typography>
              <Typography variant="body2">Due assignments: {kpi.assignmentsDue}</Typography>
              <Typography variant="body2">Attempts today: {kpi.attemptsToday}</Typography>
              <Typography variant="body2">Streaks tracked: {kpi.streakCount}</Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2">Upcoming assignments</Typography>
            <Stack spacing={1} mt={1}>
              {kpi.latestAssignments?.length ? (
                kpi.latestAssignments.map((assignment) => (
                  <Box
                    key={`assignment-${assignment.id}`}
                    sx={{ p: 1, borderRadius: 1, border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <Typography fontWeight="600">{assignment.quiz}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Skill: {assignment.skill || '—'} · Candidate ID: {assignment.userId} · Due{' '}
                      {new Date(assignment.due_date).toLocaleDateString()}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No upcoming assignments in the last cycle.
                </Typography>
              )}
            </Stack>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Quiz automation metrics not available yet.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminQuizAnalytics;
