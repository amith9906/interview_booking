import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Stack,
  Typography
} from '@mui/material';
import api from '../../utils/api';

const AdminCreditsAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/consultancies/analytics');
      setAnalytics(response.data || null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const summary = analytics?.summary || {};

  return (
    <Card variant="outlined" sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Credit & Accounting Analytics
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <Stack direction="row" spacing={3} flexWrap="wrap" mb={2}>
              <Typography variant="body2">
                Total downloads: {summary.totalDownloads ?? '—'}
              </Typography>
              <Typography variant="body2">
                Credits spent: ₹{(summary.creditsSpent ?? 0).toLocaleString()}
              </Typography>
              <Typography variant="body2">
                HR credits used: {summary.hrCount ?? '—'}
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            {analytics?.consultancies?.length ? (
              analytics.consultancies.map((consultancy) => (
                <Box key={`consultancy-${consultancy.id}`} sx={{ mb: 2 }}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography fontWeight="600">{consultancy.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Credits remaining: {consultancy.credits ?? 0}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Downloads: {consultancy.downloads ?? 0} · Resumes: {consultancy.uniqueResumes ?? 0}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No consultancy data yet.
              </Typography>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminCreditsAnalytics;
