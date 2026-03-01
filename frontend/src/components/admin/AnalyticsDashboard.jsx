import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';

const roleOptions = [
  { value: 'interviewer', label: 'Interviewer' },
  { value: 'student', label: 'Student' },
  { value: 'hr', label: 'HR / Consultancy' }
];

const AnalyticsDashboard = () => {
  const [role, setRole] = useState('interviewer');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [error, setError] = useState('');
  const [overviewError, setOverviewError] = useState('');
  const [roleTrend, setRoleTrend] = useState([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendError, setTrendError] = useState('');
  const [courseAnalytics, setCourseAnalytics] = useState(null);
  const [courseLoading, setCourseLoading] = useState(false);
  const [courseError, setCourseError] = useState('');
  const [internshipAnalytics, setInternshipAnalytics] = useState(null);
  const [internshipLoading, setInternshipLoading] = useState(false);
  const [internshipError, setInternshipError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/analytics/role', {
        params: { role, startDate, endDate }
      });
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [role, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError('');
    try {
      const response = await api.get('/admin/analytics/detailed', { params: { startDate, endDate } });
      setOverview(response.data);
    } catch (err) {
      setOverviewError(err.response?.data?.message || err.message);
    } finally {
      setOverviewLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const exportUrl = useMemo(() => {
    const base = api.defaults.baseURL || '';
    const params = new URLSearchParams({ role });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return `${base}/admin/analytics/role/export?${params.toString()}`;
  }, [role, startDate, endDate]);

  const summaryCards = useMemo(() => {
    if (!data) return [];
    if (role === 'interviewer') {
      return [
        { label: 'Bookings', value: data.summary?.totalBookings ?? 0 },
        { label: 'Revenue', value: `₹${data.summary?.revenue ?? 0}` },
        { label: 'Avg Rating', value: (data.summary?.avgRating ?? 0).toFixed(2) },
        { label: 'Completed', value: data.summary?.completed ?? 0 },
        { label: 'Upcoming', value: data.summary?.upcoming ?? 0 }
      ];
    }
    if (role === 'student') {
      return [
        { label: 'Bookings', value: data.summary?.totalBookings ?? 0 },
        { label: 'Revenue', value: `₹${data.summary?.revenue ?? 0}` },
        { label: 'Paid', value: data.summary?.paidBookings ?? 0 },
        { label: 'Repeaters', value: data.summary?.repeatBookings ?? 0 },
        { label: 'Avg Rating', value: (data.summary?.avgRating ?? 0).toFixed(2) }
      ];
    }
    return [
      { label: 'Consultancies', value: data.summary?.totalConsultancies ?? 0 },
      { label: 'Downloads', value: data.summary?.totalDownloads ?? 0 },
      { label: 'Credits spent', value: data.summary?.creditsSpent ?? 0 },
      { label: 'Credits added', value: data.summary?.creditsAdded ?? 0 }
    ];
  }, [data, role]);

  const renderRoleDetails = () => {
    if (!data) return null;
    if (role === 'interviewer') {
      return (
        <Stack spacing={2} mt={1}>
          <Typography variant="subtitle1">Top Interviewers</Typography>
          <Stack spacing={1}>
            {data.topInterviewers?.length ? (
              data.topInterviewers.map((entry) => (
                <Paper key={entry.interviewer.id} variant="outlined" sx={{ p: 1 }}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography>{entry.interviewer.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {entry.avgRating.toFixed(2)} ★
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Company: {entry.interviewer.company || 'Independent'} · Reviews: {entry.reviewCount}
                  </Typography>
                </Paper>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No rating data yet.
              </Typography>
            )}
          </Stack>
          {data.bottomInterviewers?.length > 0 && (
            <>
              <Divider />
              <Typography variant="subtitle1">Bottom Interviewers</Typography>
              <Stack spacing={1}>
                {data.bottomInterviewers.map((entry) => (
                  <Paper key={`bottom-${entry.interviewer.id}`} variant="outlined" sx={{ p: 1 }}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography>{entry.interviewer.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {entry.avgRating.toFixed(2)} ★
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Company: {entry.interviewer.company || 'Independent'} · Reviews: {entry.reviewCount}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            </>
          )}
          <Divider />
          <Typography variant="subtitle1">Skill density</Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {data.skillCount &&
              Object.entries(data.skillCount).map(([skill, count]) => (
                <Chip key={skill} label={`${skill}: ${count}`} size="small" />
              ))}
          </Stack>
        </Stack>
      );
    }
    if (role === 'student') {
      return (
        <Stack spacing={2} mt={1}>
          <Typography variant="subtitle1">Students with repeat bookings</Typography>
          {data.repeaters?.length ? (
            data.repeaters.map((student) => (
              <Paper key={student.student} variant="outlined" sx={{ p: 1 }}>
                <Typography>
                  {student.student} · {student.bookings} bookings
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {student.email}
                </Typography>
              </Paper>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No repeat students in this range.
            </Typography>
          )}
          <Divider />
          <Typography variant="subtitle1">Students overview</Typography>
          <Stack spacing={1}>
            {data.students?.slice(0, 5).map((student) => (
              <Paper key={`student-${student.id}`} variant="outlined" sx={{ p: 1 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography>{student.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {student.bookings} bookings
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Last booking: {student.lastBooking || 'n/a'}
                </Typography>
              </Paper>
            ))}
            {!data.students?.length && (
              <Typography variant="body2" color="text.secondary">
                No students have scheduled sessions yet.
              </Typography>
            )}
          </Stack>
        </Stack>
      );
    }
    if (role === 'hr') {
      return (
        <Stack spacing={2} mt={1}>
          <Typography variant="subtitle1">Consultancy usage</Typography>
          {data.consultancies?.length ? (
            data.consultancies.map((consultancy) => (
              <Paper key={consultancy.id} variant="outlined" sx={{ p: 1 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography>{consultancy.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Downloads: {consultancy.downloads}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Credits: {consultancy.credits} · Unique resumes: {consultancy.uniqueResumes}
                </Typography>
              </Paper>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No consultancies reporting in this range.
            </Typography>
          )}
          <Divider />
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Paper variant="outlined" sx={{ p: 1 }}>
              <Typography variant="caption">Credits spent</Typography>
              <Typography variant="h6">{data.summary?.creditsSpent ?? 0}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1 }}>
              <Typography variant="caption">Credits added</Typography>
              <Typography variant="h6">{data.summary?.creditsAdded ?? 0}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1 }}>
              <Typography variant="caption">Total downloads</Typography>
              <Typography variant="h6">{data.summary?.totalDownloads ?? 0}</Typography>
            </Paper>
          </Stack>
        </Stack>
      );
    }
    return null;
  };

  const overviewCards = useMemo(() => {
    if (!overview) return [];
    return [
      { label: 'Revenue', value: `₹${overview.revenue?.toLocaleString?.() ?? overview.revenue ?? 0}` },
      { label: 'Scheduled', value: overview.interviewsScheduled ?? 0 },
      { label: 'Confirmed', value: overview.interviewsConfirmed ?? 0 },
      { label: 'Postponed', value: overview.interviewsPostponed ?? 0 },
      { label: 'Pending', value: overview.interviewsPending ?? 0 },
      { label: 'Completed', value: overview.interviewsCompleted ?? 0 },
      { label: 'Total students', value: overview.totalStudents ?? 0 },
      { label: 'Total interviewers', value: overview.totalInterviewers ?? 0 },
      { label: 'Companies', value: overview.uniqueCompanies ?? 0 },
      { label: 'HR downloads', value: overview.totalDownloads ?? 0 }
    ];
  }, [overview]);

  const kpiAlerts = useMemo(() => {
    const alerts = [];
    if (overview?.interviewsPending > (overview?.interviewsCompleted ?? 0) * 2) {
      alerts.push({
        severity: 'warning',
        message: 'Pending interviews exceed twice the completed volume—follow up with interviewers.'
      });
    }
    if (overview?.interviewsPostponed > overview?.interviewsConfirmed) {
      alerts.push({
        severity: 'info',
        message: 'More interviews are being postponed than confirmed—check interviewer availability and slot quality.'
      });
    }
    if (courseAnalytics?.total && courseAnalytics.total < 2) {
      alerts.push({
        severity: 'info',
        message: 'You have fewer than two ongoing courses—consider opening more sessions.'
      });
    }
    if (internshipAnalytics?.registered && internshipAnalytics.registered < 3) {
      alerts.push({
        severity: 'info',
        message: 'Internship registrations are light; encourage students to sign up or publish more slots.'
      });
    }
    return alerts;
  }, [overview, courseAnalytics, internshipAnalytics]);

  const courseExportUrl = useMemo(() => {
    const base = api.defaults.baseURL || '';
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return `${base}/admin/courses/analytics/export?${params.toString()}`;
  }, [startDate, endDate]);

  const internshipExportUrl = useMemo(() => {
    const base = api.defaults.baseURL || '';
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return `${base}/admin/internships/analytics/export?${params.toString()}`;
  }, [startDate, endDate]);

  const fetchRoleTrend = useCallback(async () => {
    setTrendLoading(true);
    setTrendError('');
    try {
      const response = await api.get('/admin/analytics/role/trends', {
        params: { role, startDate, endDate }
      });
      setRoleTrend(response.data.trend || []);
    } catch (err) {
      setTrendError(err.response?.data?.message || err.message);
    } finally {
      setTrendLoading(false);
    }
  }, [role, startDate, endDate]);

  useEffect(() => {
    fetchRoleTrend();
  }, [fetchRoleTrend]);

  const fetchCourseAnalytics = useCallback(async () => {
    setCourseLoading(true);
    setCourseError('');
    try {
      const response = await api.get('/admin/courses/analytics', { params: { startDate, endDate } });
      setCourseAnalytics(response.data);
    } catch (err) {
      setCourseError(err.response?.data?.message || err.message);
    } finally {
      setCourseLoading(false);
    }
  }, [startDate, endDate]);

  const fetchInternshipAnalytics = useCallback(async () => {
    setInternshipLoading(true);
    setInternshipError('');
    try {
      const response = await api.get('/admin/internships/analytics', { params: { startDate, endDate } });
      setInternshipAnalytics(response.data);
    } catch (err) {
      setInternshipError(err.response?.data?.message || err.message);
    } finally {
      setInternshipLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchCourseAnalytics();
  }, [fetchCourseAnalytics]);

  useEffect(() => {
    fetchInternshipAnalytics();
  }, [fetchInternshipAnalytics]);

  const courseSummaryCards = useMemo(() => {
    if (!courseAnalytics) return [];
    const topCourse =
      [...(courseAnalytics.courses || [])].sort((a, b) => b.registrations - a.registrations)[0];
    return [
      { label: 'Total course registrations', value: courseAnalytics.totalRegistrations ?? 0 },
      { label: 'Courses tracked', value: (courseAnalytics.courses || []).length },
      { label: 'Top course', value: topCourse?.name || '—' }
    ];
  }, [courseAnalytics]);

  const internshipSummaryCards = useMemo(() => {
    if (!internshipAnalytics) return [];
    const topInternship =
      [...(internshipAnalytics.internships || [])].sort((a, b) => b.registrations - a.registrations)[0];
    return [
      { label: 'Total internship registrations', value: internshipAnalytics.totalRegistrations ?? 0 },
      { label: 'Internships tracked', value: (internshipAnalytics.internships || []).length },
      { label: 'Top internship', value: topInternship?.title || '—' }
    ];
  }, [internshipAnalytics]);

  return (
    <Card sx={{ p: 3 }}>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">Operational Overview</Typography>
          <Grid container spacing={2}>
            {overviewLoading && !overview ? (
              <Grid item xs={12}>
                <CircularProgress />
              </Grid>
            ) : overviewError ? (
              <Grid item xs={12}>
                <Alert severity="error">{overviewError}</Alert>
              </Grid>
            ) : (
              overviewCards.map((card) => (
                <Grid key={card.label} item xs={12} sm={6} md={3}>
                  <Paper variant="outlined" sx={{ p: 2, minHeight: 90 }}>
                    <Typography variant="caption">{card.label}</Typography>
                    <Typography variant="h6">{card.value}</Typography>
                  </Paper>
                </Grid>
              ))
            )}
          </Grid>
          <Stack spacing={2} direction="row" flexWrap="wrap" alignItems="center">
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>Role</InputLabel>
              <Select value={role} label="Role" onChange={(event) => setRole(event.target.value)}>
                {roleOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Start date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
            <TextField
              label="End date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
            <Button variant="outlined" onClick={() => window.open(exportUrl, '_blank')}>
              Export CSV
            </Button>
          </Stack>
          {error && <Alert severity="error">{error}</Alert>}
          {loading ? (
            <CircularProgress />
          ) : (
            <Grid container spacing={2}>
              {summaryCards.map((card) => (
                <Grid key={card.label} item xs={12} sm={6} md={3}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="caption">{card.label}</Typography>
                    <Typography variant="h5">{card.value}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
          {kpiAlerts.map((alert) => (
            <Alert key={alert.message} severity={alert.severity}>
              {alert.message}
            </Alert>
          ))}
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">Role trend ({role})</Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => window.open(exportUrl, '_blank')}
              >
                Export role CSV
              </Button>
            </Stack>
            {trendError && <Alert severity="error">{trendError}</Alert>}
            {trendLoading ? (
              <CircularProgress />
            ) : roleTrend.length ? (
              <Grid container spacing={1}>
                {roleTrend.slice(-7).map((entry) => (
                  <Grid key={entry.date} item xs={12} sm={6} md={3}>
                    <Paper variant="outlined" sx={{ p: 1 }}>
                      <Typography variant="caption">{entry.date}</Typography>
                      <Typography variant="h6">{entry.count}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No trend data in this range.
              </Typography>
            )}
          </Stack>
          {renderRoleDetails()}
          <Stack spacing={2} mt={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">Course analytics</Typography>
              <Button size="small" variant="outlined" onClick={() => window.open(courseExportUrl, '_blank')}>
                Export CSV
              </Button>
            </Stack>
          {courseError && <Alert severity="error">{courseError}</Alert>}
          {courseLoading && !courseAnalytics ? (
            <CircularProgress />
          ) : courseAnalytics ? (
            <>
              {courseAnalytics.total === 0 && (
                <Alert severity="info">No course registrations recorded in this range.</Alert>
              )}
              <Grid container spacing={2}>
                {courseSummaryCards.map((card) => (
                  <Grid key={`course-${card.label}`} item xs={12} sm={6} md={4}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="caption">{card.label}</Typography>
                      <Typography variant="h6">{card.value}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
              {(courseAnalytics.courses || []).length > 0 && (
                <Stack spacing={1} mt={2}>
                  <Typography variant="subtitle2">Top courses</Typography>
                  {(courseAnalytics.courses || [])
                    .sort((a, b) => b.registrations - a.registrations)
                    .slice(0, 3)
                    .map((course) => (
                      <Paper key={`course-top-${course.id}`} variant="outlined" sx={{ p: 1 }}>
                        <Stack direction="row" justifyContent="space-between">
                          <Box>
                            <Typography variant="body2">{course.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {course.registrations} registrations · {course.level}
                            </Typography>
                          </Box>
                          <Typography variant="body2">{course.duration_weeks} weeks</Typography>
                        </Stack>
                      </Paper>
                    ))}
                </Stack>
              )}
            </>
          ) : null}
          </Stack>
          <Stack spacing={2} mt={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">Internship analytics</Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => window.open(internshipExportUrl, '_blank')}
              >
                Export CSV
              </Button>
            </Stack>
          {internshipError && <Alert severity="error">{internshipError}</Alert>}
          {internshipLoading && !internshipAnalytics ? (
            <CircularProgress />
          ) : internshipAnalytics ? (
            <>
              {internshipAnalytics.registered === 0 && (
                <Alert severity="info">No internship registrations for the selected period.</Alert>
              )}
              <Grid container spacing={2}>
                {internshipSummaryCards.map((card) => (
                  <Grid key={`intern-${card.label}`} item xs={12} sm={6} md={4}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="caption">{card.label}</Typography>
                      <Typography variant="h6">{card.value}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
              {(internshipAnalytics.internships || []).length > 0 && (
                <Stack spacing={1} mt={2}>
                  <Typography variant="subtitle2">Top internships</Typography>
                  {(internshipAnalytics.internships || [])
                    .sort((a, b) => b.registrations - a.registrations)
                    .slice(0, 3)
                    .map((internship) => (
                      <Paper key={`intern-top-${internship.id}`} variant="outlined" sx={{ p: 1 }}>
                        <Stack direction="row" justifyContent="space-between">
                          <Box>
                            <Typography variant="body2">{internship.title}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {internship.company || 'Independent'} · {internship.registrations} registrations
                            </Typography>
                          </Box>
                          <Typography variant="body2">
                            {internship.duration_months || 'Flexible'} months
                          </Typography>
                        </Stack>
                      </Paper>
                    ))}
                </Stack>
              )}
            </>
          ) : null}
          </Stack>
          {overview && (
            <Stack spacing={2} mt={2}>
              <Typography variant="subtitle1">HR download behavior</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, minHeight: 200 }}>
                    <Typography variant="subtitle2" mb={1}>
                      Trend (downloads per day)
                    </Typography>
                    <Stack spacing={1}>
                      {overview.hrDownloadTrend?.length ? (
                        overview.hrDownloadTrend.map((entry) => (
                          <Stack
                            key={entry.date}
                            direction="row"
                            justifyContent="space-between"
                            divider={<Divider flexItem orientation="vertical" />}
                            spacing={1}
                          >
                            <Typography variant="body2">{entry.date}</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {entry.downloads}
                            </Typography>
                          </Stack>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No downloads in this range.
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, minHeight: 200 }}>
                    <Typography variant="subtitle2" mb={1}>
                      Profile types (by top skill)
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {overview.hrSkillBreakdown?.length ? (
                        overview.hrSkillBreakdown.map((entry) => (
                          <Chip key={entry.skill} label={`${entry.skill}: ${entry.downloads}`} size="small" />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No skills tagged yet.
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" mb={1}>
                  Downloads by consultancy
                </Typography>
                <Stack spacing={1}>
                  {overview.hrDownloadsByConsultancy?.length ? (
                    overview.hrDownloadsByConsultancy.map((entry) => (
                      <Paper key={entry.name} variant="elevation" sx={{ p: 1, background: 'rgba(15,23,42,0.4)' }}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography>{entry.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Credits spent: {entry.creditsSpent}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          Downloads: {entry.downloads}
                        </Typography>
                      </Paper>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No consultancies have downloaded resumes in this timeframe.
                    </Typography>
                  )}
                </Stack>
              </Paper>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default AnalyticsDashboard;
