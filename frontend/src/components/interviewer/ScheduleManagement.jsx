import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toastError, toastSuccess } from '../../services/toastService';
import api from '../../utils/api';
import {
  fetchInterviewerBookings,
  startInterviewerBooking,
  submitInterviewRating
} from '../../store/bookingSlice';

const ScheduleManagement = () => {
  const dispatch = useDispatch();
  const bookings = useSelector((state) => state.booking.interviewerBookings || []);
  const loading = useSelector((state) => state.booking.interviewerStatus === 'loading');
  const [ratingDialog, setRatingDialog] = useState({
    open: false,
    booking: null,
    skillRatings: [],
    overallRating: '',
    skillComments: '',
    feedback: '',
    improve: ''
  });
  const [postponeDialog, setPostponeDialog] = useState({
    open: false,
    booking: null,
    slot: ''
  });
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [downloadingResumeId, setDownloadingResumeId] = useState(null);

  useEffect(() => {
    dispatch(fetchInterviewerBookings());
  }, [dispatch]);

  const reloadBookings = () => {
    dispatch(fetchInterviewerBookings());
  };

  const handleAcknowledgeBooking = async (bookingId) => {
    try {
      await api.post(`/interviewer/bookings/${bookingId}/acknowledge`);
      toastSuccess('Booking accepted and student notified.');
      reloadBookings();
    } catch (error) {
      toastError(error.response?.data?.message || 'Unable to accept booking.');
    }
  };

  const handleOpenPostponeDialog = (booking) => {
    const slotValue = booking.slot_time
      ? new Date(booking.slot_time).toISOString().slice(0, 16)
      : '';
    setPostponeDialog({ open: true, booking, slot: slotValue });
  };

  const handleClosePostponeDialog = () => {
    setPostponeDialog({ open: false, booking: null, slot: '' });
  };

  const handleConfirmPostpone = async () => {
    if (!postponeDialog.booking) return;
    if (!postponeDialog.slot) {
      toastError('Please select a new slot before confirming the reschedule.');
      return;
    }
    setRescheduleLoading(true);
    try {
      await api.post(`/interviewer/bookings/${postponeDialog.booking.id}/reschedule`, {
        slot_time: new Date(postponeDialog.slot).toISOString()
      });
      toastSuccess('Booking postponed; student and admin notified.');
      handleClosePostponeDialog();
      reloadBookings();
    } catch (error) {
      toastError(error.response?.data?.message || 'Unable to postpone booking.');
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleStartBooking = async (bookingId) => {
    await dispatch(startInterviewerBooking(bookingId));
    reloadBookings();
  };

  const openRatingDialog = (booking) => {
    const skillList =
      booking.student?.skills?.length
        ? booking.student.skills
        : booking.interviewer?.skill_set?.length
        ? booking.interviewer.skill_set
        : ['General'];
    const existingSkillComments =
      typeof booking.interview?.skill_comments === 'string'
        ? {}
        : booking.interview?.skill_comments || {};
    const generalSkillComment =
      typeof booking.interview?.skill_comments === 'string'
        ? booking.interview.skill_comments
        : booking.interview?.skill_comments?.general || '';
    setRatingDialog({
      open: true,
      booking,
      skillRatings: skillList.map((skill) => ({
        skill,
        rating: booking.interview?.skill_ratings?.[skill]?.toString() || '',
        comment: existingSkillComments[skill] || ''
      })),
      overallRating: booking.interview?.overall_rating?.toString() || '',
      skillComments: generalSkillComment,
      feedback: booking.interview?.feedback || '',
      improve: (booking.interview?.improve_areas || []).join(', ')
    });
  };

  const closeRatingDialog = () => {
    setRatingDialog((prev) => ({ ...prev, open: false }));
  };

  const handleRatingChange = (index, field, value) => {
    setRatingDialog((prev) => {
      const next = [...prev.skillRatings];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, skillRatings: next };
    });
  };

  const submitRating = async () => {
    if (!ratingDialog.booking) return;
    const skill_ratings = {};
    const skill_comments = {};
    ratingDialog.skillRatings.forEach((entry) => {
      const name = entry.skill?.trim();
      const ratingValue = Number(entry.rating);
      if (name && ratingValue >= 1 && ratingValue <= 5) {
        skill_ratings[name] = ratingValue;
      }
      if (name && entry.comment?.trim()) {
        skill_comments[name] = entry.comment.trim();
      }
    });
    if (ratingDialog.skillComments?.trim()) {
      skill_comments.general = ratingDialog.skillComments.trim();
    }
    const payload = {
      booking_id: ratingDialog.booking.id,
      skill_ratings,
      skill_comments: Object.keys(skill_comments).length ? skill_comments : undefined,
      overall_rating: Number(ratingDialog.overallRating) || 0,
      feedback: ratingDialog.feedback,
      improve_areas: ratingDialog.improve
        ? ratingDialog.improve.split(',').map((item) => item.trim()).filter(Boolean)
        : []
    };
    await dispatch(submitInterviewRating(payload));
    closeRatingDialog();
    reloadBookings();
  };
  const handleAddSkillEntry = () => {
    setRatingDialog((prev) => ({
      ...prev,
      skillRatings: [...prev.skillRatings, { skill: '', rating: '', comment: '' }]
    }));
  };

  const handleRemoveSkillEntry = (index) => {
    setRatingDialog((prev) => {
      const next = [...prev.skillRatings];
      if (next.length <= 1) return prev;
      next.splice(index, 1);
      return { ...prev, skillRatings: next };
    });
  };

  const handleDownloadResume = async (resumeId) => {
    if (!resumeId) return;
    setDownloadingResumeId(resumeId);
    try {
      const response = await api.get(`/interviewer/resumes/${resumeId}`);
      const url = response.data?.url;
      if (url) {
        window.open(url, '_blank', 'noreferrer');
      } else {
        toastError('Resume download link is not available.');
      }
    } catch (error) {
      toastError(error.response?.data?.message || 'Unable to download resume.');
    } finally {
      setDownloadingResumeId(null);
    }
  };

  return (
    <Box>
      <Typography variant="h6" mb={2}>
        Interviewer Calendar
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <Stack spacing={2}>
          {bookings.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No bookings yet.
            </Typography>
          )}
          {bookings.map((booking) => {
            const latestResume =
              booking.student?.resumes?.length
                ? booking.student.resumes[booking.student.resumes.length - 1]
                : null;
            return (
              <Card key={booking.id} sx={{ background: 'rgba(255,255,255,0.02)' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="subtitle1">
                      Slot: {booking.slot_time ? new Date(booking.slot_time).toLocaleString() : 'TBD'}
                    </Typography>
                    <Chip
                      label={(booking.status || 'pending').replace('_', ' ')}
                      color={
                        booking.status === 'completed'
                          ? 'success'
                          : booking.status === 'in_progress'
                          ? 'info'
                          : 'default'
                      }
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Student: {booking.student?.name || 'Unknown'} ({booking.student?.User?.email})
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Skills: {(booking.student?.skills || ['—']).join(', ')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Experience: {booking.student?.experience_years ?? '—'} years
                  </Typography>
                  <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
                    <Button
                      variant="contained"
                      disabled={booking.status !== 'pending'}
                      onClick={() => handleAcknowledgeBooking(booking.id)}
                      color="success"
                    >
                      Accept
                    </Button>
                    <Button
                      variant="outlined"
                      color="warning"
                      disabled={booking.status !== 'pending'}
                      onClick={() => handleOpenPostponeDialog(booking)}
                    >
                      Postpone
                    </Button>
                    <Button
                      variant="outlined"
                      disabled={booking.status !== 'pending'}
                      onClick={() => handleStartBooking(booking.id)}
                    >
                      Start
                    </Button>
                    <Button
                      variant="contained"
                      disabled={booking.status === 'completed'}
                      onClick={() => openRatingDialog(booking)}
                    >
                      Complete &amp; give feedback
                    </Button>
                    {latestResume && (
                      <Button
                        size="small"
                        variant="text"
                        disabled={downloadingResumeId === latestResume.id}
                        onClick={() => handleDownloadResume(latestResume.id)}
                      >
                        {downloadingResumeId === latestResume.id ? 'Downloading...' : 'Resume'}
                      </Button>
                    )}
                  </Stack>
              </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
      <Dialog open={ratingDialog.open} onClose={closeRatingDialog} fullWidth maxWidth="sm">
        <DialogTitle>Publish feedback</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="subtitle2">Skill-wise ratings</Typography>
            <Stack spacing={1}>
              {ratingDialog.skillRatings.map((entry, idx) => (
                <Stack key={idx} spacing={1}>
                  <Stack alignItems="center" spacing={1} direction="row">
                    <TextField
                      size="small"
                      label="Skill"
                      value={entry.skill}
                      onChange={(event) => handleRatingChange(idx, 'skill', event.target.value)}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      size="small"
                      label="Rating"
                      type="number"
                      inputProps={{ min: 1, max: 5 }}
                      value={entry.rating}
                      onChange={(event) => handleRatingChange(idx, 'rating', event.target.value)}
                      sx={{ width: 110 }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveSkillEntry(idx)}
                      disabled={ratingDialog.skillRatings.length <= 1}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Stack>
                  <TextField
                    size="small"
                    label="Skill comments"
                    value={entry.comment}
                    onChange={(event) => handleRatingChange(idx, 'comment', event.target.value)}
                    multiline
                    rows={2}
                    fullWidth
                  />
                  <Divider />
                </Stack>
              ))}
              <Button size="small" startIcon={<Add />} variant="outlined" onClick={handleAddSkillEntry}>
                Add skill
              </Button>
            </Stack>
            <Typography variant="subtitle2">General</Typography>
            <Stack spacing={1}>
              <TextField
                label="Overall rating (1-5)"
                type="number"
                inputProps={{ min: 1, max: 5 }}
                value={ratingDialog.overallRating}
                onChange={(event) =>
                  setRatingDialog((prev) => ({ ...prev, overallRating: event.target.value }))
                }
              />
              <TextField
                label="Skill comments"
                value={ratingDialog.skillComments}
                onChange={(event) => setRatingDialog((prev) => ({ ...prev, skillComments: event.target.value }))}
                multiline
                rows={2}
              />
              <TextField
                label="General comments"
                value={ratingDialog.feedback}
                onChange={(event) => setRatingDialog((prev) => ({ ...prev, feedback: event.target.value }))}
                multiline
                rows={3}
              />
              <TextField
                label="Improvement areas (comma separated)"
                value={ratingDialog.improve}
                onChange={(event) => setRatingDialog((prev) => ({ ...prev, improve: event.target.value }))}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRatingDialog}>Cancel</Button>
          <Button variant="contained" onClick={submitRating}>
            Publish feedback
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={postponeDialog.open} onClose={handleClosePostponeDialog} fullWidth maxWidth="xs">
        <DialogTitle>Reschedule booking</DialogTitle>
        <DialogContent>
          <TextField
            label="New slot"
            type="datetime-local"
            value={postponeDialog.slot}
            onChange={(event) => setPostponeDialog((prev) => ({ ...prev, slot: event.target.value }))}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePostponeDialog} disabled={rescheduleLoading}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleConfirmPostpone} disabled={rescheduleLoading}>
            {rescheduleLoading ? 'Postponing…' : 'Postpone'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScheduleManagement;
