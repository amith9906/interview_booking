import {
  Alert,
  Box,
  Button,
  Container,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  Chip
} from '@mui/material';
import BookingCalendar from '../components/student/BookingCalendar';
import QuizDashboard from '../components/student/QuizDashboard';
import FeedbackDashboard from '../components/student/FeedbackDashboard';
import InterviewSearch from '../components/student/InterviewSearch';
import ProfileOnboarding from '../components/onboarding/ProfileOnboarding';
import StudentAnalytics from '../components/analytics/StudentAnalytics';
import StudentResources from '../components/student/StudentResources';
import AccountSettings from '../components/account/AccountSettings';
import StudentBookings from '../components/student/StudentBookings';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  enrollCourses,
  fetchCourses,
  fetchInternships,
  registerInternship,
  resetInternshipRegisterStatus,
  verifyStripeSession
} from '../store/bookingSlice';
import { useLocation } from 'react-router-dom';
import { getBadges } from '../utils/engagementBadges';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const courses = useSelector((state) => state.booking.courses);
  const enrollStatus = useSelector((state) => state.booking.enrollStatus);
  const sessionStatus = useSelector((state) => state.booking.sessionStatus);
  const internships = useSelector((state) => state.booking.internships);
  const internshipStatus = useSelector((state) => state.booking.internshipStatus);
  const internshipRegisterStatus = useSelector((state) => state.booking.internshipRegisterStatus);
  const bookingError = useSelector((state) => state.booking.error);
  const location = useLocation();
  const [value, setValue] = useState(0);
  const [selectedSkills, setSelectedSkills] = useState({});
  const [internshipPurposes, setInternshipPurposes] = useState({});
  const [internshipDurations, setInternshipDurations] = useState({});
  const [internshipStartDates, setInternshipStartDates] = useState({});
  const [submittingInternshipId, setSubmittingInternshipId] = useState(null);
  const enrolledCourses = courses.filter((course) => course.status !== 'available');
  const availableCourses = courses.filter((course) => course.status === 'available');
  const registeredInternships = internships.filter((internship) => internship.registration_id);
  const availableInternships = internships.filter((internship) => !internship.registration_id);
  const [badges, setBadges] = useState(() => getBadges());
  const courseAnalytics = useMemo(() => {
    const completed = enrolledCourses.filter((course) => course.status === 'completed').length;
    const instructors = enrolledCourses.reduce((acc, course) => {
      if (course.instructor?.name) {
        acc[course.instructor.name] = (acc[course.instructor.name] || 0) + 1;
      }
      return acc;
    }, {});
    const topInstructor = Object.entries(instructors)
      .sort(([, a], [, b]) => b - a)
      .map(([name]) => name)[0];
    return {
      total: enrolledCourses.length,
      completed,
      topInstructor: topInstructor || 'TBD',
      active: Math.max(0, enrolledCourses.length - completed)
    };
  }, [enrolledCourses]);
  const internshipAnalytics = useMemo(() => {
    const registered = registeredInternships.length;
    const open = availableInternships.length;
    const avgDuration =
      registeredInternships
        .map((internship) => internship.duration_months || internship.duration_selected)
        .filter(Boolean)
        .reduce((sum, value) => sum + value, 0) || 0;
    const avg = registered ? Math.round(avgDuration / registered) : 0;
    return {
      registered,
      open,
      avgDuration: avg || 'TBD'
    };
  }, [registeredInternships, availableInternships]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchInternships());
  }, [dispatch]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      dispatch(verifyStripeSession(sessionId));
      setValue(7); // Switch to feedback tab on successful payment return
    }
  }, [dispatch, location.search]);

  useEffect(() => {
    if (internshipRegisterStatus === 'succeeded') {
      dispatch(fetchInternships());
      const timer = setTimeout(() => {
        dispatch(resetInternshipRegisterStatus());
      }, 2500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [internshipRegisterStatus, dispatch]);

  useEffect(() => {
    if (internshipRegisterStatus !== 'loading') {
      setSubmittingInternshipId(null);
    }
  }, [internshipRegisterStatus]);

  useEffect(() => {
    const handleStorage = () => setBadges(getBadges());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleEnroll = (courseId) => {
    dispatch(enrollCourses({ course_ids: [courseId] }));
  };

  const handleSkillChange = (internshipId, value) => {
    setSelectedSkills((prev) => ({ ...prev, [internshipId]: value }));
  };

  const handlePurposeChange = (internshipId, value) => {
    setInternshipPurposes((prev) => ({ ...prev, [internshipId]: value }));
  };

  const handleDurationChange = (internshipId, value) => {
    setInternshipDurations((prev) => ({ ...prev, [internshipId]: value }));
  };

  const handleStartDateChange = (internshipId, value) => {
    setInternshipStartDates((prev) => ({ ...prev, [internshipId]: value }));
  };

  const handleRegisterInternship = (internship) => {
    setSubmittingInternshipId(internship.id);
    dispatch(
      registerInternship({
        internship_id: internship.id,
        desired_skills: selectedSkills[internship.id] || internship.desired_skills,
        purpose: internshipPurposes[internship.id],
        duration_months:
          internshipDurations[internship.id] || internship.duration_selected || internship.duration_months,
        start_date: internshipStartDates[internship.id]
      })
    );
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" mb={3} fontWeight="bold">
        Student Portal
      </Typography>
      {badges.length ? (
        <Stack direction="row" spacing={1} flexWrap="wrap" mb={3}>
          {badges.map((badge) => (
            <Chip key={badge} label={badge} color="primary" variant="filled" />
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary" mb={3}>
          Earn badges by completing quizzes or receiving positive feedback; they surface here once unlocked.
        </Typography>
      )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="student dashboard tabs"
            textColor="primary"
            indicatorColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Analytics & Profile" />
            <Tab label="Coding Quizzes" />
            <Tab label="Book an Interview" />
            <Tab label="My Interviews" />
            <Tab label="Courses" />
            <Tab label="Internships" />
            <Tab label="Resources" />
            <Tab label="Feedback & History" />
            <Tab label="Account" />
          </Tabs>
        </Box>

      <TabPanel value={value} index={0}>
        <StudentAnalytics />
        <Box sx={{ mt: 4 }}>
          <ProfileOnboarding role="student" />
        </Box>
      </TabPanel>
      <TabPanel value={value} index={1}>
        <QuizDashboard />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <InterviewSearch />
        <Box sx={{ mt: 3 }}>
          <BookingCalendar />
        </Box>
      </TabPanel>
      <TabPanel value={value} index={3}>
        <Typography variant="h6" mb={2} fontWeight="bold">
          My interviews
        </Typography>
        <StudentBookings />
      </TabPanel>
      <TabPanel value={value} index={4}>
        <Stack spacing={3}>
          <Stack spacing={2}>
            <Typography variant="h6">My courses</Typography>
              <Grid container spacing={2}>
                {[
                  { label: 'Enrolled', value: courseAnalytics.total },
                  { label: 'Completed', value: courseAnalytics.completed },
                  { label: 'Active', value: courseAnalytics.active },
                  { label: 'Top instructor', value: courseAnalytics.topInstructor }
                ].map((card) => (
                  <Grid key={card.label} item xs={6} sm={3}>
                    <Paper variant="outlined" sx={{ p: 1 }}>
                      <Typography variant="caption">{card.label}</Typography>
                      <Typography variant="h6">{card.value}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
              {enrolledCourses.length ? (
              enrolledCourses.map((course) => (
                <Paper
                  key={course.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}
                >
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack spacing={0.5}>
                        <Typography variant="subtitle1">{course.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {course.level} · {course.duration_weeks || 'Flexible'} weeks
                        </Typography>
                        {course.instructor && (
                          <Typography variant="body2" color="text.secondary">
                            Instructor: {course.instructor.name}
                            {course.instructor.title ? ` · ${course.instructor.title}` : ''}
                            {course.instructor.email ? ` · ${course.instructor.email}` : ''}
                          </Typography>
                        )}
                      </Stack>
                      <Chip label={`Status: ${course.status}`} variant="outlined" size="small" />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {course.description}
                    </Typography>
                    {course.enrolled_at && (
                      <Typography variant="caption" color="text.secondary">
                        Enrolled on {new Date(course.enrolled_at).toLocaleDateString()}
                      </Typography>
                    )}
                  </Stack>
                </Paper>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                You have not enrolled in any courses yet.
              </Typography>
            )}
          </Stack>
          <Divider />
          <Stack spacing={2}>
            <Typography variant="h6">Available courses</Typography>
            {availableCourses.length ? (
              availableCourses.map((course) => (
                <Paper
                  key={course.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle1">{course.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {course.level} · {course.duration_weeks || 'Flexible'} weeks
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {course.description}
                      </Typography>
                      {course.instructor && (
                        <Typography variant="caption" color="text.secondary">
                          Instructor: {course.instructor.name}
                          {course.instructor.title ? ` · ${course.instructor.title}` : ''}
                        </Typography>
                      )}
                    </Stack>
                    <Button
                      variant="outlined"
                      onClick={() => handleEnroll(course.id)}
                      disabled={enrollStatus === 'loading' || course.status !== 'available'}
                    >
                      Enroll
                    </Button>
                  </Stack>
                </Paper>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No new courses are available at the moment.
              </Typography>
            )}
          </Stack>
        </Stack>
      </TabPanel>
      <TabPanel value={value} index={5}>
        <Stack spacing={3}>
          <Stack spacing={2}>
            <Typography variant="h6">My internships</Typography>
            <Grid container spacing={2}>
              {[
                { label: 'Registered', value: internshipAnalytics.registered },
                { label: 'Open', value: internshipAnalytics.open },
                { label: 'Avg duration', value: internshipAnalytics.avgDuration }
              ].map((card) => (
                <Grid key={card.label} item xs={12} sm={4}>
                  <Paper variant="outlined" sx={{ p: 1 }}>
                    <Typography variant="caption">{card.label}</Typography>
                    <Typography variant="h6">{card.value}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
            {registeredInternships.length ? (
              registeredInternships.map((internship) => (
                <Paper
                  key={internship.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}
                >
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack spacing={0.5}>
                        <Typography variant="subtitle1">{internship.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {internship.company || 'Independent'} · {internship.location || 'Remote'} ·{' '}
                          {internship.duration_months || 'Flexible'} months
                        </Typography>
                      </Stack>
                      <Chip label={`Status: ${internship.status}`} variant="outlined" size="small" />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Desired skills:{' '}
                      {(internship.registration?.desired_skills || []).length
                        ? internship.registration.desired_skills.join(', ')
                        : '–'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Purpose: {internship.registration?.purpose || '–'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Preferred duration:{' '}
                      {internship.registration?.duration_months || internship.duration_months || '–'} months
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Start date:{' '}
                      {internship.registration?.start_date
                        ? new Date(internship.registration.start_date).toLocaleDateString()
                        : 'TBD'}
                    </Typography>
                  </Stack>
                </Paper>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                You have not registered for any internships yet.
              </Typography>
            )}
          </Stack>
          <Divider />
          <Stack spacing={2}>
            <Typography variant="h6">Available internships</Typography>
            {internshipRegisterStatus === 'succeeded' && (
              <Alert severity="success">Internship registration saved. Admin will review shortly.</Alert>
            )}
            {internshipRegisterStatus === 'failed' && (
              <Alert severity="error">
                {bookingError || 'Unable to submit internship registration. Please try again.'}
              </Alert>
            )}
            {internshipStatus === 'loading' ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
              </Box>
            ) : availableInternships.length ? (
              availableInternships.map((internship) => {
                const currentSkills = selectedSkills[internship.id] ?? internship.desired_skills ?? [];
                const durationOptions = Array.from(
                  new Set([1, 2, 3, 6, 12, internship.duration_months].filter(Boolean))
                );
                const currentDuration =
                  internshipDurations[internship.id] ??
                  internship.duration_selected ??
                  internship.duration_months ??
                  durationOptions[0] ??
                  '';
                const currentPurpose = internshipPurposes[internship.id] ?? internship.purpose ?? '';
                const currentStartDate = internshipStartDates[internship.id] ?? internship.start_date ?? '';
                const actionLabel =
                  internship.status === 'registered' ? 'Update registration' : 'Register';
                return (
                  <Paper
                    key={internship.id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      background: 'rgba(255,255,255,0.02)',
                      borderColor: 'rgba(255,255,255,0.1)'
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Stack spacing={0.5}>
                        <Typography variant="subtitle1">{internship.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {internship.company || 'Independent'} · {internship.location || 'Remote'} ·{' '}
                          {internship.duration_months || 'Flexible'} months
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" spacing={1} mt={1}>
                          {internship.skills?.length
                            ? internship.skills.map((skill) => (
                                <Chip key={skill} label={skill} size="small" />
                              ))
                            : (
                              <Chip label="General skill focus" size="small" />
                            )}
                          <Chip label={`Status: ${internship.status}`} variant="outlined" size="small" />
                        </Stack>
                      </Stack>
                    </Stack>
                    <Stack spacing={2} mt={2}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Desired skills</InputLabel>
                        <Select
                          multiple
                          value={currentSkills}
                          label="Desired skills"
                          onChange={(event) => handleSkillChange(internship.id, event.target.value)}
                          renderValue={(selected) =>
                            (selected || []).length ? (selected || []).join(', ') : 'Select skills'
                          }
                          disabled={!internship.skills?.length}
                        >
                          {internship.skills?.map((skill) => (
                            <MenuItem key={skill} value={skill}>
                              {skill}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl fullWidth size="small">
                        <InputLabel>Duration (months)</InputLabel>
                        <Select
                          value={currentDuration}
                          label="Duration (months)"
                          onChange={(event) => handleDurationChange(internship.id, event.target.value)}
                        >
                          {durationOptions.map((duration) => (
                            <MenuItem key={duration} value={duration}>
                              {duration} months
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField
                        label="Start date"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={currentStartDate || ''}
                        onChange={(event) => handleStartDateChange(internship.id, event.target.value)}
                        fullWidth
                        size="small"
                      />
                      <TextField
                        label="Purpose / expectations"
                        multiline
                        rows={2}
                        fullWidth
                        size="small"
                        value={currentPurpose}
                        onChange={(event) => handlePurposeChange(internship.id, event.target.value)}
                      />
                      <Button
                        variant="contained"
                        onClick={() => handleRegisterInternship(internship)}
                        disabled={
                          internshipRegisterStatus === 'loading' && submittingInternshipId === internship.id
                        }
                      >
                        {internshipRegisterStatus === 'loading' &&
                        submittingInternshipId === internship.id
                          ? 'Submitting…'
                          : actionLabel}
                      </Button>
                    </Stack>
                  </Paper>
                );
              })
            ) : (
              <Typography variant="body2" color="text.secondary">
                No internships published yet.
              </Typography>
            )}
          </Stack>
        </Stack>
      </TabPanel>
      <TabPanel value={value} index={6}>
        <StudentResources />
      </TabPanel>
      <TabPanel value={value} index={7}>
        {sessionStatus === 'loading' && (
          <Typography variant="body2" color="text.secondary" mb={2}>
            Confirming payment session…
          </Typography>
        )}
        {sessionStatus === 'succeeded' && (
          <Typography variant="body2" color="success.main" mb={2}>
            Payment verified! Feedback will arrive shortly.
          </Typography>
        )}
        {sessionStatus === 'failed' && (
          <Typography variant="body2" color="error.main" mb={2}>
            Unable to verify session. Contact support.
          </Typography>
        )}
        <FeedbackDashboard />
      </TabPanel>
      <TabPanel value={value} index={8}>
        <AccountSettings />
      </TabPanel>
    </Container>
  );
};

export default StudentDashboard;
