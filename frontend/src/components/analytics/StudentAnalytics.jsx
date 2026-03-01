import { keyframes } from '@emotion/react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import StarIcon from '@mui/icons-material/Star';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import api from '../../utils/api';

const pulse = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
  100% { transform: translateY(0px); }
`;

const shimmer = keyframes`
  0% { background-position: -150px 0; }
  100% { background-position: 150px 0; }
`;

const StudentAnalytics = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/student/analytics').then((response) => setStats(response.data));
  }, []);

  if (!stats) return null;

  return (
    <Card
      sx={{
        mt: 3,
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'radial-gradient(circle at top right, rgba(99,102,241,0.35), rgba(15,23,42,0.9) 45%)',
        boxShadow: '0 25px 60px rgba(15,23,42,0.6)',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(120deg, rgba(255,255,255,0.08), transparent 45%)',
          opacity: 0.6,
          animation: `${shimmer} 3s linear infinite`
        }
      }}
    >
      <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Student Overview
            </Typography>
            <Stack spacing={2} mt={2}>
              {[
                ['Total Bookings', stats.totalBookings],
                ['Paid / Completed', stats.paidBookings],
                [
                  'Average Rating',
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <StarIcon fontSize="small" sx={{ color: '#facc15' }} />
                    <Typography fontWeight="bold" color="primary.light">
                      {stats.avgRating?.toFixed(1) ?? '0.0'}
                    </Typography>
                  </Stack>
                ]
              ].map(([label, value]) => (
                <Box
                  key={label}
                  sx={{
                    px: 3,
                    py: 2,
                    borderRadius: 3,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(148,163,184,0.05)',
                    animation: `${pulse} 6s ease-in-out infinite`
                  }}
                >
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">{label}</Typography>
                    {typeof value === 'string' || typeof value === 'number' ? (
                      <Typography fontWeight="bold">{value}</Typography>
                    ) : (
                      value
                    )}
                  </Stack>
                </Box>
              ))}
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
              <Typography variant="subtitle2" color="text.secondary">
                Core Skills
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {(stats.topSkills || []).map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    size="small"
                    variant="outlined"
                    sx={{ borderColor: 'rgba(148,163,184,0.5)', color: '#e0e7ff' }}
                  />
                ))}
              </Stack>
              <Box
                sx={{
                  mt: 2,
                  borderRadius: 3,
                  p: 3,
                  background: 'rgba(56,189,248,0.08)',
                  border: '1px solid rgba(56,189,248,0.3)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(120deg, transparent 0%, rgba(59,130,246,0.08) 40%, transparent 80%)',
                    animation: `${shimmer} 4s linear infinite`
                  }
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <CheckCircleOutlineIcon color="success" fontSize="small" />
                  <Typography variant="subtitle2" color="success.main">
                    Skill Badges
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Earned when interviewers confirm you scored 4+ on a specific skill.
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                  Keep collecting positive feedback to unlock badges.
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1} position="relative" sx={{ zIndex: 1 }}>
                  {(stats.endorsedSkills || []).length > 0 ? (
                    stats.endorsedSkills.map((skill) => (
                      <Chip
                        key={skill}
                        label={skill}
                        size="small"
                        color="success"
                        icon={<CheckCircleOutlineIcon />}
                        sx={{ fontWeight: 'bold' }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Keep collecting positive feedback to unlock badges.
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Stack>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Stack
              alignItems="center"
              sx={{
                px: 3,
                py: 4,
                borderRadius: 4,
                background:
                  'linear-gradient(180deg, rgba(248,250,252,0.02), rgba(99,102,241,0.35))',
                border: '1px solid rgba(99,102,241,0.4)',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 45px rgba(15,23,42,0.6)'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  inset: '-40% auto auto -10%',
                  width: 220,
                  height: 220,
                  background: 'rgba(59,130,246,0.4)',
                  filter: 'blur(60px)',
                  opacity: 0.45,
                  pointerEvents: 'none'
                }}
              />
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Resume ATS Score
              </Typography>
              <Box position="relative" display="inline-flex" my={2}>
                <CircularProgress
                  variant="determinate"
                  value={stats.atsScore || 0}
                  size={110}
                  thickness={5}
                  color={stats.atsScore > 75 ? 'success' : stats.atsScore > 50 ? 'warning' : 'error'}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography variant="h4" component="div" color="text.primary" fontWeight="bold">
                    {Math.round(stats.atsScore || 0)}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 260 }}>
                Score based on extracted skills, experience, and verified endorsements.
              </Typography>
            </Stack>

            <Box
              mt={3}
              sx={{
                borderRadius: 3,
                border: '1px solid rgba(248,250,252,0.1)',
                background: 'rgba(15,23,42,0.5)',
                p: 3,
                animation: `${pulse} 5s ease-in-out infinite`
              }}
            >
              <Typography variant="subtitle2" color="error.light" gutterBottom>
                Identified Skill Gaps
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1} mb={2}>
                {(stats.missingSkills || []).map((s) => (
                  <Chip key={s} label={s} size="small" color="error" variant="outlined" />
                ))}
              </Stack>
              {stats.recommendedCourses && stats.recommendedCourses.length > 0 && (
                <>
                  <Typography variant="subtitle2" color="primary.light" gutterBottom>
                    Recommended Courses to upskill:
                  </Typography>
                  <List dense disablePadding>
                    {stats.recommendedCourses.map((course) => (
                      <ListItem key={course.id} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <SchoolIcon color="primary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={course.name} primaryTypographyProps={{ variant: 'body2' }} />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default StudentAnalytics;
