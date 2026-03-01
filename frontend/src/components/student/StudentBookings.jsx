import { Box, Card, CardContent, Chip, CircularProgress, Stack, Typography, Button } from '@mui/material';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStudentBookings } from '../../store/bookingSlice';

const statusColor = {
  pending: 'warning',
  confirmed: 'success',
  completed: 'primary',
  paid: 'info',
  in_progress: 'info',
  postponed: 'warning'
};

const StudentBookings = () => {
  const dispatch = useDispatch();
  const bookings = useSelector((state) => state.booking.studentBookings || []);
  const status = useSelector((state) => state.booking.studentBookingsStatus);

  useEffect(() => {
    dispatch(fetchStudentBookings());
  }, [dispatch]);

  if (status === 'loading') {
    return (
      <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {bookings.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No interviews scheduled yet. Use the booking tab to reserve a slot.
        </Typography>
      ) : (
        bookings.map((booking) => (
          <Card key={booking.id} sx={{ background: 'rgba(255,255,255,0.02)' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1">
                  Slot:{' '}
                  {booking.slot_time ? new Date(booking.slot_time).toLocaleString() : 'TBD'}
                </Typography>
                <Chip
                  label={(booking.status || 'pending').replace('_', ' ')}
                  color={statusColor[booking.status] || 'default'}
                />
              </Stack>
              {booking.interviewer && (
                <>
                  <Typography variant="body2" color="text.secondary">
                    Interviewer: {booking.interviewer.name || 'TBD'}{' '}
                    {booking.interviewer.company ? `· ${booking.interviewer.company}` : ''}
                  </Typography>
                  {booking.interviewer.meeting_link && (
                    <Typography variant="body2" color="text.secondary">
                      Meeting link:{' '}
                      <Button
                        href={booking.interviewer.meeting_link}
                        target="_blank"
                        rel="noreferrer"
                        size="small"
                      >
                        Open
                      </Button>
                    </Typography>
                  )}
                </>
              )}
              <Typography variant="body2" color="text.secondary">
                Amount paid: ₹{booking.amount ?? '—'}
              </Typography>
            </CardContent>
          </Card>
        ))
      )}
    </Stack>
  );
};

export default StudentBookings;
