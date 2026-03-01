import { Card, CardContent, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import api from '../../utils/api';

const InterviewerAnalytics = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/interviewer/analytics').then((response) => setStats(response.data));
  }, []);

  if (!stats) return null;

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6">Interviewer Analytics</Typography>
        <Stack spacing={1} mt={2}>
          <Typography>Upcoming bookings: {stats.upcoming}</Typography>
          <Typography>Completed bookings: {stats.completed}</Typography>
          <Typography>Average rating: {stats.avgRating}</Typography>
          <Typography>Total bookings: {stats.totalBookings}</Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default InterviewerAnalytics;
