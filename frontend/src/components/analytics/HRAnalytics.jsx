import { Card, CardContent, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import api from '../../utils/api';

const HRAnalytics = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/hr/analytics').then((response) => setStats(response.data));
  }, []);

  if (!stats) return null;

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6">HR Analytics</Typography>
        <Stack spacing={1} mt={2}>
          <Typography>Points: {stats.points}</Typography>
          <Typography>Subscription active: {stats.subscription_active ? 'Yes' : 'No'}</Typography>
          <Typography>Plan expiry: {new Date(stats.plan_expiry).toLocaleDateString()}</Typography>
          <Typography>Total downloads: {stats.totalDownloads}</Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default HRAnalytics;
