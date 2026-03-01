import { Avatar, Box, Button, Card, CardActions, CardContent, Chip, Divider, Grid, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { bookInterview } from '../../store/bookingSlice';
import WorkIcon from '@mui/icons-material/Work';
import CodeIcon from '@mui/icons-material/Code';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';

const BookingCalendar = () => {
  const dispatch = useDispatch();
  const availableInterviewers = useSelector((state) => state.booking.availableInterviewers);
  const bookingStatus = useSelector((state) => state.booking.bookingStatus);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const handleSelectSlot = (interviewerId, date, time) => {
    setSelectedSlot({ interviewerId, date, time });
  };

  const handleBook = async (interviewer) => {
    if (!selectedSlot || selectedSlot.interviewerId !== interviewer.id) return;

    const slotTime = `${selectedSlot.date}T${selectedSlot.time}:00`;
    try {
      const result = await dispatch(
        bookInterview({ interviewer_id: interviewer.id, slot_time: slotTime, amount: interviewer.rate || 1000 })
      ).unwrap();
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      console.error('Booking failed', err);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom fontWeight="bold" mt={4}>
        Available Interviewers
      </Typography>

      <Stack spacing={4} mt={2}>
        {availableInterviewers.length === 0 && (
          <Typography variant="body1" color="text.secondary">
            {bookingStatus === 'loading' ? 'Searching for interviewers...' : 'Use the search above to find interviewers.'}
          </Typography>
        )}

        {availableInterviewers
          .filter((i) => i.availability_slots && i.availability_slots.length > 0)
          .map((interviewer) => {
            const rating = Number(interviewer.average_rating || 0);
            const isTopRated = rating >= 4.6;
            const ratingDisplay = rating ? rating.toFixed(1) : '—';
            return (
              <Card
                key={interviewer.id}
                sx={{
                  background: 'rgba(15,23,42,0.8)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  overflow: 'visible'
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
                  <Grid container spacing={3}>
                    {/* Profile Details Column */}
                    <Grid item xs={12} md={6}>
                      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                        <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.5rem' }}>
                          <PersonIcon fontSize="large" />
                        </Avatar>
                        <Box>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="h5" fontWeight="bold">
                              {interviewer.User?.name || 'Interviewer'}
                            </Typography>
                            {isTopRated && (
                              <Chip
                                label="Top Rated Interviewer"
                                size="small"
                                icon={<StarIcon />}
                                color="warning"
                                sx={{
                                  background: 'linear-gradient(135deg, #fef3c7 20%, #fde68a 90%)',
                                  color: '#1f2937',
                                  fontWeight: 'bold',
                                  boxShadow: '0 0 12px rgba(250, 204, 21, 0.35)'
                                }}
                              />
                            )}
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                            <StarIcon fontSize="small" color={isTopRated ? 'warning' : 'action'} />
                            <Typography variant="body2" color="text.secondary">
                              {ratingDisplay} avg. rating
                            </Typography>
                          </Stack>
                          {interviewer.title && (
                            <Typography variant="body2" color="text.secondary">
                              {interviewer.title}
                            </Typography>
                          )}
                          <Typography variant="subtitle1" color="primary.light">
                            {interviewer.Company?.name || 'Independent Consultant'}
                          </Typography>
                        </Box>
                      </Stack>

                      <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.05)' }} />

                      <Stack spacing={2}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <WorkIcon color="action" fontSize="small" />
                          <Typography variant="body2" color="text.secondary">
                            <strong style={{ color: '#fff' }}>{interviewer.experience_years || 0}+ Years</strong> of Industry Experience
                          </Typography>
                        </Stack>

                        <Box>
                          <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                            <CodeIcon color="action" fontSize="small" />
                            <Typography variant="body2" color="text.secondary">
                              Core Expertise
                            </Typography>
                          </Stack>
                          <Stack direction="row" flexWrap="wrap" gap={1}>
                            {(interviewer.skill_set || []).map((skill) => (
                              <Chip key={skill} label={skill} size="small" sx={{ background: 'rgba(255,255,255,0.05)' }} />
                            ))}
                          </Stack>
                        </Box>
                      </Stack>
                    </Grid>

                    {/* Vertical Divider for desktop */}
                    <Grid item xs={12} md={1} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
                      <Divider orientation="vertical" sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
                    </Grid>

                    {/* Slots Column */}
                    <Grid item xs={12} md={5}>
                      <Typography variant="subtitle2" color="text.secondary" mb={2} textTransform="uppercase" letterSpacing={1}>
                        Available Time Slots
                      </Typography>
                      <Stack spacing={3}>
                        {(interviewer.availability_slots || []).map((slotObj) => {
                          const slotDate = new Date(slotObj.date);
                          const weekLabel = slotDate.toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          });
                          const slotCount = (slotObj.time_slots || []).length;
                          return (
                            <Box key={slotObj.date}>
                              <Typography variant="body2" fontWeight="bold" mb={1.5} color="primary.light">
                                Week of {weekLabel} · {slotCount} slot{slotCount === 1 ? '' : 's'}
                              </Typography>
                              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                                {(slotObj.time_slots || []).map((slotItem) => {
                                  const timeStr = typeof slotItem === 'object' ? slotItem.time : slotItem;
                                  const isBooked = typeof slotItem === 'object' ? slotItem.is_booked : false;

                                  const isSelected =
                                    selectedSlot?.interviewerId === interviewer.id &&
                                    selectedSlot?.date === slotObj.date &&
                                    selectedSlot?.time === timeStr;

                                  return (
                                    <Chip
                                      key={timeStr}
                                      label={timeStr}
                                      color={isSelected ? 'primary' : 'default'}
                                      variant={isSelected ? 'filled' : 'outlined'}
                                      onClick={() => !isBooked && handleSelectSlot(interviewer.id, slotObj.date, timeStr)}
                                      disabled={isBooked}
                                      sx={{
                                        cursor: isBooked ? 'not-allowed' : 'pointer',
                                        fontSize: '0.9rem',
                                        px: 1,
                                        py: 2,
                                        opacity: isBooked ? 0.3 : 1,
                                        textDecoration: isBooked ? 'line-through' : 'none',
                                        '&:hover': {
                                          background: isSelected || isBooked ? '' : 'rgba(255,255,255,0.1)'
                                        }
                                      }}
                                    />
                                  );
                                })}
                              </Stack>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Grid>
                  </Grid>
                </CardContent>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />

                <CardActions sx={{ justifyContent: 'space-between', p: 3, background: 'rgba(0,0,0,0.2)' }}>
                  <Typography variant="h6" fontWeight="bold">
                    ₹{interviewer.rate || 1000}{' '}
                    <Typography component="span" variant="body2" color="text.secondary">
                      / session
                    </Typography>
                  </Typography>
            <Button
              size="large"
              variant="contained"
              onClick={() => handleBook(interviewer)}
              disabled={bookingStatus === 'loading' || selectedSlot?.interviewerId !== interviewer.id}
              sx={{ px: 4, py: 1, fontWeight: 'bold' }}
            >
              Proceed to Payment (Card / UPI)
            </Button>
            <Typography variant="caption" color="text.secondary">
              Payments processed in INR via Stripe (cards + UPI).
            </Typography>
                </CardActions>
              </Card>
            );
          })}

        {availableInterviewers.length > 0 &&
          availableInterviewers.every((i) => !i.availability_slots || i.availability_slots.length === 0) && (
            <Card sx={{ p: 4, textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <Typography variant="h6" color="text.secondary" mb={1}>
                No Slots Available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                The interviewers matching your criteria do not have any open time slots at the moment.
              </Typography>
            </Card>
          )}
      </Stack>
    </Box>
  );
};

export default BookingCalendar;
