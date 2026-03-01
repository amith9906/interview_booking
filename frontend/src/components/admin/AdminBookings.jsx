import {
  Add,
  Delete
} from '@mui/icons-material';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
import { useEffect, useMemo, useState } from 'react';
import { toastError } from '../../services/toastService';
import api from '../../utils/api';
import FilterBar from './FilterBar';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [interviewers, setInterviewers] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingInterviewers, setLoadingInterviewers] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [downloadingResumeId, setDownloadingResumeId] = useState(null);
  const [form, setForm] = useState(() => ({
    studentId: '',
    companyId: '',
    interviewerId: '',
    slotTime: '',
    skill: '',
    amount: '',
    notes: '',
    status: 'pending'
  }));
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    studentId: '',
    interviewerId: '',
    status: ''
  });
  const [bookingActionLoading, setBookingActionLoading] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedbackBooking, setFeedbackBooking] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({
    overallRating: '',
    overallFeedback: '',
    skillRatings: [],
    skillComments: ''
  });
  const [studentFeedbackDialog, setStudentFeedbackDialog] = useState({
    open: false,
    data: null
  });

  const DEFAULT_SKILL = 'Communication';
  const SKILL_SUGGESTION_LIST_ID = 'admin-feedback-skill-suggestions';

  const loadBookings = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.studentId) params.studentId = filters.studentId;
      if (filters.interviewerId) params.interviewerId = filters.interviewerId;
      if (filters.status) params.status = filters.status;
      const response = await api.get('/admin/bookings', { params });
      setBookings(response.data.bookings || []);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    setLoadingStudents(true);
    try {
      const response = await api.get('/admin/students');
      setStudents(response.data.students || []);
    } catch (error) {
      toastError('Unable to load students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const response = await api.get('/admin/companies');
      setCompanies(response.data || []);
    } catch (error) {
      toastError('Unable to load companies');
    } finally {
      setLoadingCompanies(false);
    }
  };

  const loadInterviewers = async (companyId, skill) => {
    if (!companyId) {
      setInterviewers([]);
      return;
    }
    setLoadingInterviewers(true);
    try {
      const params = { company_id: companyId };
      if (skill) params.skill = skill;
      const response = await api.get('/admin/interviewers', { params });
      setInterviewers(response.data || []);
    } catch (error) {
      toastError('Unable to load interviewers for the selected company');
    } finally {
      setLoadingInterviewers(false);
    }
  };

  useEffect(() => {
    loadStudents();
    loadCompanies();
  }, []);

  useEffect(() => {
    loadBookings();
  }, [filters]);

  useEffect(() => {
    loadInterviewers(form.companyId, form.skill);
  }, [form.companyId, form.skill]);

  const selectedInterviewer = useMemo(
    () => interviewers.find((interviewer) => interviewer.id === Number(form.interviewerId)),
    [interviewers, form.interviewerId]
  );
  const studentOptions = useMemo(
    () => students.map((student) => ({ value: student.id, label: student.name || student.email })),
    [students]
  );
  const interviewerFilterOptions = useMemo(
    () =>
      interviewers.map((interviewer) => ({
        value: interviewer.id,
        label: interviewer.User?.name || interviewer.User?.email || interviewer.title || `Interviewer ${interviewer.id}`
      })),
    [interviewers]
  );

  const skillSuggestions = useMemo(() => {
    if (!feedbackBooking) return [];
    const suggestions = new Set();
    suggestions.add(DEFAULT_SKILL);
    (feedbackBooking.interviewer?.skill_set || []).forEach((skill) => skill && suggestions.add(skill));
    (feedbackBooking.student?.skills || []).forEach((skill) => skill && suggestions.add(skill));
    return Array.from(suggestions);
  }, [feedbackBooking]);
  const suggestedSkillNames = useMemo(
    () => skillSuggestions.filter((skill) => skill && skill !== DEFAULT_SKILL),
    [skillSuggestions]
  );

  const formatTime = (value) => (value ? new Date(value).toLocaleString() : '—');

  const resetForm = () =>
    setForm({
      studentId: '',
      companyId: '',
      interviewerId: '',
      slotTime: '',
      skill: '',
      amount: '',
      notes: '',
      status: 'pending'
    });

  const handleSchedule = async () => {
    if (!form.studentId || !form.companyId || !form.interviewerId || !form.slotTime) {
      toastError('Select student, company, interviewer, and slot time');
      return;
    }
    setLoadingSchedule(true);
    try {
      const parsedAmount = Number(form.amount);
      const finalAmount =
        Number.isFinite(parsedAmount) && parsedAmount >= 0 ? parsedAmount : selectedInterviewer?.rate ?? 1000;
      const payload = {
        student_id: Number(form.studentId),
        interviewer_id: Number(form.interviewerId),
        company_id: Number(form.companyId),
        slot_time: new Date(form.slotTime).toISOString(),
        skill: form.skill,
        notes: form.notes,
        amount: finalAmount,
        status: form.status
      };
      await api.post('/admin/bookings', payload);
      setDialogOpen(false);
      resetForm();
      loadBookings();
    } finally {
      setLoadingSchedule(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const handleFieldChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCompanySelection = (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, companyId: value, interviewerId: '' }));
  };

  useEffect(() => {
    if (!selectedInterviewer) return;
    setForm((prev) => {
      if (prev.amount) return prev;
      return { ...prev, amount: String(selectedInterviewer.rate ?? '') };
    });
  }, [selectedInterviewer]);

  const handleStart = async (bookingId) => {
    setBookingActionLoading(true);
    try {
      await api.patch(`/admin/bookings/${bookingId}/start`);
      loadBookings();
    } catch (error) {
      toastError(error.response?.data?.message || 'Unable to start the interview.');
    } finally {
      setBookingActionLoading(false);
    }
  };

  const handleDownloadResume = async (resumeId) => {
    if (!resumeId) return;
    setDownloadingResumeId(resumeId);
    try {
      const response = await api.get(`/admin/resumes/${resumeId}`);
      const url = response.data?.url;
      if (url) {
        window.open(url, '_blank', 'noreferrer');
      } else {
        toastError('Resume link is unavailable.');
      }
    } catch (error) {
      toastError(error.response?.data?.message || 'Unable to download resume.');
    } finally {
      setDownloadingResumeId(null);
    }
  };

  const openFeedbackDialog = (booking) => {
    if (!booking) return;
    const skillSet =
      booking.interviewer?.skill_set?.length
        ? booking.interviewer.skill_set
        : ['General'];
    const normalizedSkillSet = [...new Set([...skillSet, DEFAULT_SKILL])];
    const existingSkillComments =
      typeof booking.interview?.skill_comments === 'string'
        ? {}
        : booking.interview?.skill_comments || {};
    const generalSkillComment =
      typeof booking.interview?.skill_comments === 'string'
        ? booking.interview.skill_comments
        : booking.interview?.skill_comments?.general || '';
    const skillRatings = normalizedSkillSet.map((skill) => ({
      skill,
      rating: booking.interview?.skill_ratings?.[skill]?.toString() || '',
      comment: existingSkillComments[skill] || ''
    }));
    setFeedbackBooking(booking);
    setFeedbackForm({
      overallRating: booking.interview?.overall_rating?.toString() || '',
      overallFeedback: booking.interview?.feedback || '',
      skillRatings,
      skillComments: generalSkillComment,
      improveAreas: (booking.interview?.improve_areas || []).join(', ')
    });
    setFeedbackDialogOpen(true);
  };

  const submitFeedback = async () => {
    if (!feedbackBooking) return;
    const ratingValue = Number(feedbackForm.overallRating);
    if (!ratingValue || ratingValue < 1 || ratingValue > 5) {
      toastError('Provide an overall rating between 1 and 5');
      return;
    }
    const skillRatingsPayload = {};
    const skillCommentsPayload = {};
    feedbackForm.skillRatings.forEach((entry) => {
      const skillName = entry.skill?.trim();
      if (!skillName) return;
      const value = Number(entry.rating);
      if (value && value >= 1 && value <= 5) {
        skillRatingsPayload[skillName] = value;
      }
      if (entry.comment?.trim()) {
        skillCommentsPayload[skillName] = entry.comment.trim();
      }
    });
    if (feedbackForm.skillComments?.trim()) {
      skillCommentsPayload.general = feedbackForm.skillComments.trim();
    }
    const skillCommentsFinal =
      Object.keys(skillCommentsPayload).length > 0 ? skillCommentsPayload : undefined;
    setBookingActionLoading(true);
    try {
      await api.post(`/admin/bookings/${feedbackBooking.id}/complete`, {
        overall_rating: ratingValue,
        feedback: feedbackForm.overallFeedback,
        skill_ratings: skillRatingsPayload,
        skill_comments: skillCommentsFinal,
        improve_areas: feedbackForm.improveAreas
          ? feedbackForm.improveAreas.split(',').map((item) => item.trim()).filter(Boolean)
          : []
      });
      setFeedbackDialogOpen(false);
      setFeedbackBooking(null);
      loadBookings();
    } catch (error) {
      toastError(error.response?.data?.message || 'Unable to publish feedback.');
    } finally {
      setBookingActionLoading(false);
    }
  };
  const openStudentFeedbackDialog = (feedback) => {
    if (!feedback) return;
    setStudentFeedbackDialog({ open: true, data: feedback });
  };

  const closeStudentFeedbackDialog = () => {
    setStudentFeedbackDialog({ open: false, data: null });
  };
  const renderStudentSkillFeedback = (feedback) => {
    if (!feedback?.skillRatings || typeof feedback.skillRatings !== 'object') {
      return null;
    }
    return Object.entries(feedback.skillRatings || {}).map(([skill, rating]) => (
      <Stack key={skill} spacing={0.5}>
        <Typography variant="subtitle2">{skill}</Typography>
        <Typography variant="body2">Rating: {rating ?? '—'}</Typography>
      </Stack>
    ));
  };
  const handleAddSkillEntry = () => {
    setFeedbackForm((prev) => ({
      ...prev,
      skillRatings: [
        ...prev.skillRatings,
        { skill: '', rating: '', comment: '' }
      ]
    }));
  };

  const handleRemoveSkillEntry = (index) => {
    setFeedbackForm((prev) => {
      const next = [...prev.skillRatings];
      next.splice(index, 1);
      return { ...prev, skillRatings: next };
    });
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Stack spacing={2}>
       <Typography variant="h6">All Interviews & Feedback</Typography>
       <Button variant="contained" onClick={() => setDialogOpen(true)} sx={{ alignSelf: 'flex-start' }}>
         Schedule interview
       </Button>
        <FilterBar
          filters={filters}
          onChange={setFilters}
          fields={[
            { name: 'studentId', label: 'Student', options: studentOptions },
            { name: 'interviewerId', label: 'Interviewer', options: interviewerFilterOptions }
          ]}
          showStatus
          statusOptions={[
            { value: '', label: 'All statuses' },
            { value: 'pending', label: 'Pending' },
            { value: 'paid', label: 'Paid' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' }
          ]}
        />
        {loading ? (
          <CircularProgress />
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Slot</TableCell>
                      <TableCell>Student</TableCell>
                      <TableCell>Interviewer</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Rating</TableCell>
                      <TableCell>Student feedback</TableCell>
                      <TableCell>Feedback</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
              <TableBody>
                {bookings.map((booking) => {
                  const latestResume =
                    booking.student?.resumes?.length
                      ? booking.student.resumes[booking.student.resumes.length - 1]
                      : null;
                  return (
                    <TableRow key={booking.id}>
                      <TableCell>{formatTime(booking.slot_time)}</TableCell>
                      <TableCell>
                        {booking.student?.name}
                      <Typography variant="caption" color="text.secondary" display="block">
                        {booking.student?.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {booking.interviewer?.name}
                      <Typography variant="caption" color="text.secondary" display="block">
                        {booking.interviewer?.email}
                      </Typography>
                    </TableCell>
                    <TableCell>{booking.status}</TableCell>
                    <TableCell>₹{booking.amount ?? 0}</TableCell>
                    <TableCell>{booking.interview?.overall_rating?.toFixed?.(1) ?? '—'}</TableCell>
                    <TableCell>
                      {booking.studentFeedback?.submitted ? (
                        <Stack spacing={0.5}>
                          <Typography variant="body2" fontWeight="bold">
                            {booking.studentFeedback?.overallRating
                              ? `Rating ${Number(booking.studentFeedback.overallRating).toFixed(1)}`
                              : 'Rating pending'}
                          </Typography>
                          {booking.studentFeedback?.comments && (
                            <Typography variant="caption" color="text.secondary">
                              {booking.studentFeedback.comments}
                            </Typography>
                          )}
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => openStudentFeedbackDialog(booking.studentFeedback)}
                          >
                            View details
                          </Button>
                        </Stack>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                      <TableCell>{booking.interview?.feedback || '—'}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={booking.status !== 'pending' || bookingActionLoading}
                            onClick={() => handleStart(booking.id)}
                          >
                            Start
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            disabled={booking.status === 'completed' || bookingActionLoading}
                            onClick={() => openFeedbackDialog(booking)}
                          >
                            Complete
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
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!bookings.length && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No interviews scheduled yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
          <DialogTitle>Schedule interview</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} mt={1}>
              <FormControl fullWidth size="small">
                <InputLabel id="booking-student-label">Student</InputLabel>
                <Select
                  labelId="booking-student-label"
                  label="Student"
                  value={form.studentId}
                  onChange={handleFieldChange('studentId')}
                  disabled={loadingStudents}
                >
                  <MenuItem value="">
                    <em>Select student</em>
                  </MenuItem>
                  {loadingStudents && (
                    <MenuItem disabled>Loading students…</MenuItem>
                  )}
                  {!students.length && !loadingStudents && (
                    <MenuItem disabled>No students found</MenuItem>
                  )}
                  {students.map((student) => (
                    <MenuItem key={student.id} value={student.id}>
                      {student.name || student.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel id="booking-company-label">Company</InputLabel>
                <Select
                  labelId="booking-company-label"
                  label="Company"
                  value={form.companyId}
                  onChange={handleCompanySelection}
                  disabled={loadingCompanies}
                >
                  <MenuItem value="">
                    <em>Select company</em>
                  </MenuItem>
                  {loadingCompanies && (
                    <MenuItem disabled>Loading companies…</MenuItem>
                  )}
                  {!companies.length && !loadingCompanies && (
                    <MenuItem disabled>No companies found</MenuItem>
                  )}
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="Preferred skill (optional)"
                value={form.skill}
                onChange={handleFieldChange('skill')}
                placeholder="React, Node.js, PostgreSQL..."
              />
              <FormControl fullWidth size="small">
                <InputLabel id="booking-interviewer-label">Interviewer</InputLabel>
                <Select
                  labelId="booking-interviewer-label"
                  label="Interviewer"
                  value={form.interviewerId}
                  onChange={handleFieldChange('interviewerId')}
                  disabled={!form.companyId || loadingInterviewers}
                >
                  <MenuItem value="">
                    <em>Select interviewer</em>
                  </MenuItem>
                  {loadingInterviewers && (
                    <MenuItem disabled>Loading interviewers…</MenuItem>
                  )}
                  {!interviewers.length && !loadingInterviewers && (
                    <MenuItem disabled>No interviewers found</MenuItem>
                  )}
                  {interviewers.map((interviewer) => (
                    <MenuItem key={interviewer.id} value={interviewer.id}>
                      {interviewer.User?.name || interviewer.User?.email}
                    </MenuItem>
                  ))}
                  {!interviewers.length && !loadingInterviewers && (
                    <MenuItem disabled>No interviewers found</MenuItem>
                  )}
                </Select>
              </FormControl>
              {selectedInterviewer?.availability_slots?.length ? (
                <Typography variant="caption" color="text.secondary">
                  Availability:{' '}
                  {selectedInterviewer.availability_slots
                    .map((slot) => `${slot.day}: ${slot.slots?.join(', ')}`)
                    .join(' · ')}
                </Typography>
              ) : null}
              <TextField
                size="small"
                label="Slot time"
                type="datetime-local"
                value={form.slotTime}
                onChange={handleFieldChange('slotTime')}
                InputLabelProps={{ shrink: true }}
              />
              <FormControl fullWidth size="small">
                <InputLabel id="booking-status-label">Status</InputLabel>
                <Select
                  labelId="booking-status-label"
                  label="Status"
                  value={form.status}
                  onChange={handleFieldChange('status')}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="Amount (INR)"
                type="number"
                value={form.amount}
                onChange={handleFieldChange('amount')}
                InputProps={{ inputProps: { min: 0 } }}
              />
              <TextField
                size="small"
                label="Notes (optional)"
                value={form.notes}
                onChange={handleFieldChange('notes')}
                multiline
                minRows={2}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={loadingSchedule}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSchedule} disabled={loadingSchedule}>
              {loadingSchedule ? 'Scheduling…' : 'Schedule interview'}
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog open={feedbackDialogOpen} onClose={() => setFeedbackDialogOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Publish feedback template</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} mt={1}>
              <TextField
                label="Overall rating (1-5)"
                type="number"
                value={feedbackForm.overallRating}
                InputProps={{ inputProps: { min: 1, max: 5 } }}
                onChange={(event) =>
                  setFeedbackForm((prev) => ({ ...prev, overallRating: event.target.value }))
                }
              />
              <TextField
                label="Overall feedback"
                value={feedbackForm.overallFeedback}
                multiline
                rows={3}
                onChange={(event) =>
                  setFeedbackForm((prev) => ({ ...prev, overallFeedback: event.target.value }))
                }
              />
              <Typography variant="subtitle2">Skill-wise ratings</Typography>
              <Stack spacing={1}>
                {feedbackForm.skillRatings.map((entry, idx) => (
                  <Stack key={idx} spacing={1}>
                    <Stack alignItems="center" spacing={1} direction="row">
                      <TextField
                        size="small"
                        label="Skill"
                        value={entry.skill}
                        placeholder="Pick or type a skill"
                        inputProps={{ list: SKILL_SUGGESTION_LIST_ID }}
                        onChange={(event) => {
                          const value = event.target.value;
                          setFeedbackForm((prev) => {
                            const next = [...prev.skillRatings];
                            next[idx] = { ...next[idx], skill: value };
                            return { ...prev, skillRatings: next };
                          });
                        }}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        size="small"
                        label="Rating"
                        type="number"
                        value={entry.rating}
                        InputProps={{ inputProps: { min: 1, max: 5 } }}
                        onChange={(event) => {
                          const value = event.target.value;
                          setFeedbackForm((prev) => {
                            const next = [...prev.skillRatings];
                            next[idx] = { ...next[idx], rating: value };
                            return { ...prev, skillRatings: next };
                          });
                        }}
                        sx={{ width: 100 }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveSkillEntry(idx)}
                        disabled={feedbackForm.skillRatings.length <= 1}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Stack>
                    <TextField
                      size="small"
                      label="Skill comments"
                      value={entry.comment}
                      onChange={(event) => {
                        const value = event.target.value;
                        setFeedbackForm((prev) => {
                          const next = [...prev.skillRatings];
                          next[idx] = { ...next[idx], comment: value };
                          return { ...prev, skillRatings: next };
                        });
                      }}
                      multiline
                      rows={2}
                      fullWidth
                    />
                    <Divider />
                  </Stack>
                ))}
                <Button
                  size="small"
                  startIcon={<Add />}
                  variant="outlined"
                  onClick={handleAddSkillEntry}
                >
                  Add skill
                </Button>
              </Stack>
              {skillSuggestions.length > 0 && (
                <datalist id={SKILL_SUGGESTION_LIST_ID}>
                  {skillSuggestions.map((skill) => (
                    <option key={skill} value={skill} />
                  ))}
                </datalist>
              )}
              {suggestedSkillNames.length > 0 && (
                <Typography variant="caption" color="text.secondary">
                  Suggested skills: {suggestedSkillNames.join(', ')}
                </Typography>
              )}
              <TextField
                label="Skill comments (general)"
                multiline
                rows={2}
                value={feedbackForm.skillComments}
                onChange={(event) =>
                  setFeedbackForm((prev) => ({ ...prev, skillComments: event.target.value }))
                }
              />
              <TextField
                label="Improvement areas"
                multiline
                rows={2}
                value={feedbackForm.improveAreas}
                onChange={(event) =>
                  setFeedbackForm((prev) => ({ ...prev, improveAreas: event.target.value }))
                }
              />
              <Typography variant="caption" color="text.secondary">
                This data populates the downloadable feedback template and student view.
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFeedbackDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={submitFeedback} disabled={bookingActionLoading}>
              Publish template
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={studentFeedbackDialog.open}
          onClose={closeStudentFeedbackDialog}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Student feedback for interviewer</DialogTitle>
          <DialogContent dividers>
            {studentFeedbackDialog.data ? (
              <Stack spacing={2} mt={1}>
                <Typography variant="body2" color="text.secondary">
                  Submitted:&nbsp;
                  {studentFeedbackDialog.data.submitted ? (
                    <strong>
                      {studentFeedbackDialog.data.submittedAt
                        ? new Date(studentFeedbackDialog.data.submittedAt).toLocaleString()
                        : 'Yes'}
                    </strong>
                  ) : (
                    'Not yet submitted'
                  )}
                </Typography>
                {studentFeedbackDialog.data.overallRating && (
                  <Typography variant="h6">
                    Overall rating: {Number(studentFeedbackDialog.data.overallRating).toFixed(1)}
                  </Typography>
                )}
                {studentFeedbackDialog.data.comments && (
                  <Typography variant="body2">{studentFeedbackDialog.data.comments}</Typography>
                )}
                {renderStudentSkillFeedback(studentFeedbackDialog.data)}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No student feedback captured yet.
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeStudentFeedbackDialog}>Close</Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Paper>
  );
};

export default AdminBookings;
