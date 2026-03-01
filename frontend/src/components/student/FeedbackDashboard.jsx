import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Rating,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFeedback } from '../../store/bookingSlice';
import api from '../../utils/api';

const FeedbackDashboard = () => {
  const dispatch = useDispatch();
  const feedback = useSelector((state) => state.booking.feedback.interviews || []);
  const [downloadingId, setDownloadingId] = useState(null);
  const [emailingId, setEmailingId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [studentFeedbackForm, setStudentFeedbackForm] = useState({
    overallRating: 0,
    comments: ''
  });
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogMessageType, setDialogMessageType] = useState('info');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    dispatch(fetchFeedback());
  }, [dispatch]);

  const renderSkills = (interview) =>
    Object.entries(interview.skill_ratings || {}).map(([skill, rating]) => (
      <Stack key={skill} spacing={0.5}>
        <Typography variant="subtitle1">{skill}</Typography>
        <Typography variant="body2">
          Rating: {rating} / 5
        </Typography>
        {interview.skill_comments?.[skill] && (
          <Typography variant="body2" color="text.secondary">
            Comment: {interview.skill_comments[skill]}
          </Typography>
        )}
        <Divider />
      </Stack>
    ));

  const handleDownloadReport = async (bookingId) => {
    if (!bookingId) return;
    setStatusMessage('');
    setDownloadingId(bookingId);
    try {
      const response = await api.get(`/student/feedback/${bookingId}/report`, {
        responseType: 'arraybuffer'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `feedback-${bookingId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
      setStatusMessage('Unable to download report right now. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleEmailReport = async (bookingId) => {
    if (!bookingId) return;
    setStatusMessage('');
    setEmailingId(bookingId);
    try {
      await api.post(`/student/feedback/${bookingId}/report/email`);
      setStatusMessage('Feedback report emailed to your inbox.');
    } catch (err) {
      console.error('Email failed', err);
      setStatusMessage('Unable to email the report right now.');
    } finally {
      setEmailingId(null);
    }
  };

  const openFeedbackDialog = (interview) => {
    if (!interview) return;
    setSelectedInterview(interview);
    setStudentFeedbackForm({
      overallRating: interview.student_overall_rating ?? 0,
      comments: interview.student_comments || ''
    });
    setDialogMessage('');
    setDialogMessageType('info');
    setFeedbackDialogOpen(true);
  };

  const closeFeedbackDialog = () => {
    setFeedbackDialogOpen(false);
    setSelectedInterview(null);
    setDialogMessage('');
  };

  const handleStudentFeedbackSubmit = async () => {
    if (!selectedInterview) return;
    const bookingId = selectedInterview.Booking?.id || selectedInterview.booking_id;
    if (!bookingId) {
      setDialogMessage('Unable to locate booking reference.');
      setDialogMessageType('error');
      return;
    }
    setSubmittingFeedback(true);
    setDialogMessage('');
    try {
      await api.post(`/student/feedback/${bookingId}`, {
        comments: studentFeedbackForm.comments,
        overall_rating: studentFeedbackForm.overallRating
      });
      setDialogMessageType('success');
      setDialogMessage('Feedback submitted. Thanks for sharing your thoughts!');
      setStatusMessage('Your feedback was recorded.');
      dispatch(fetchFeedback());
      closeFeedbackDialog();
    } catch (error) {
      setDialogMessageType('error');
      setDialogMessage(error.response?.data?.message || 'Unable to submit feedback right now.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const canSubmitFeedback =
    Boolean(selectedInterview?.interviewer_feedback_published) && !selectedInterview?.student_feedback_submitted;

  return (
    <>
      <Card variant="outlined" sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" mb={1}>
          Feedback & Recommendations
        </Typography>
        {statusMessage && (
          <Typography variant="caption" color="success.main" mb={2} display="block">
            {statusMessage}
          </Typography>
        )}
        <Stack spacing={2}>
          {feedback.length ? (
            feedback.map((interview) => {
              const booking = interview.Booking || {};
              const interviewer = booking.Interviewer || {};
              const interviewerName = interviewer.User?.name || 'Interviewer';
              const slotTime = booking.slot_time ? new Date(booking.slot_time).toLocaleString() : 'TBD';
              const bookingId = booking.id || interview.booking_id;
              return (
                <Stack key={interview.id} spacing={1} sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Typography variant="body2" color="text.secondary">
                    Interviewed on: {new Date(interview.created_at).toLocaleDateString()} · Slot: {slotTime}
                  </Typography>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {interviewerName} · {interviewer.title || 'Interviewer'} · {interviewer.Company?.name || 'Independent'}
                  </Typography>
                  {renderSkills(interview)}
                  {interview.feedback && (
                    <Typography variant="body2" color="text.secondary">
                      Summary: {interview.feedback}
                    </Typography>
                  )}
                  {interview.improve_areas?.length > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Improvement areas: {interview.improve_areas.join(', ')}
                    </Typography>
                  )}
                  <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => openFeedbackDialog(interview)}
                      disabled={!interview.interviewer_feedback_published && !interview.student_feedback_submitted}
                    >
                      Preview template & give feedback
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleDownloadReport(bookingId)}
                      disabled={downloadingId === bookingId}
                    >
                      {downloadingId === bookingId ? 'Downloading…' : 'Download PDF'}
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleEmailReport(bookingId)}
                      disabled={emailingId === bookingId}
                    >
                      {emailingId === bookingId ? 'Emailing…' : 'Email me report'}
                    </Button>
                  </Stack>
                </Stack>
              );
            })
          ) : (
            <Typography variant="body2" color="text.secondary">
              Waiting on interview feedback.
            </Typography>
          )}
        </Stack>
      </CardContent>
      </Card>
      <Dialog open={feedbackDialogOpen} onClose={closeFeedbackDialog} fullWidth maxWidth="sm">
        <DialogTitle>Interview template & your feedback</DialogTitle>
        <DialogContent dividers>
          {selectedInterview ? (
            <>
              <Typography variant="subtitle2" fontWeight="bold">
                {selectedInterview.Booking?.Interviewer?.User?.name || 'Interviewer'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Slot:{' '}
                {selectedInterview.Booking?.slot_time
                  ? new Date(selectedInterview.Booking.slot_time).toLocaleString()
                  : 'TBD'}
              </Typography>
              <Stack spacing={2} mt={2}>
                {renderSkills(selectedInterview)}
              </Stack>
              {selectedInterview.improve_areas?.length > 0 && (
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Improvement areas: {selectedInterview.improve_areas.join(', ')}
                </Typography>
              )}
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2">Your feedback</Typography>
              <Typography variant="body2" color="text.secondary">
                Share an overall rating and general comments for the interviewer.
              </Typography>
              <Typography variant="body2" mt={1}>
                Overall rating
              </Typography>
              <Rating
                value={studentFeedbackForm.overallRating}
                precision={0.5}
                onChange={(_, value) =>
                  setStudentFeedbackForm((prev) => ({ ...prev, overallRating: value ?? 0 }))
                }
                disabled={!canSubmitFeedback}
              />
              <TextField
                label="Comments / improvement suggestions"
                value={studentFeedbackForm.comments}
                fullWidth
                multiline
                minRows={3}
                onChange={(event) =>
                  setStudentFeedbackForm((prev) => ({ ...prev, comments: event.target.value }))
                }
                disabled={!canSubmitFeedback}
                sx={{ mt: 1 }}
              />
              {dialogMessage && (
                <Typography
                  variant="caption"
                  color={dialogMessageType === 'success' ? 'success.main' : 'error.main'}
                  display="block"
                  mt={1}
                >
                  {dialogMessage}
                </Typography>
              )}
              {!selectedInterview.interviewer_feedback_published && (
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Interviewer feedback has not been published yet. The template will appear when ready.
                </Typography>
              )}
              {selectedInterview.student_feedback_submitted && (
                <Typography variant="body2" color="text.primary" mt={1}>
                  You already submitted your feedback. Thank you!
                </Typography>
              )}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Loading…
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeFeedbackDialog} disabled={submittingFeedback}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handleStudentFeedbackSubmit}
            disabled={!canSubmitFeedback || submittingFeedback}
          >
            {submittingFeedback ? 'Submitting…' : 'Submit feedback'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FeedbackDashboard;
