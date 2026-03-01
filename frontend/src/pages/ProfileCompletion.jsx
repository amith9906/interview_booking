import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import { Chip, Container, Grid, Paper, Stack, Typography } from '@mui/material';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import LayersIcon from '@mui/icons-material/Layers';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ProfileOnboarding from '../components/onboarding/ProfileOnboarding';
import { fetchProfile } from '../store/authSlice';
import roleRoutes from '../utils/roleRoutes';
import { getBadges } from '../utils/engagementBadges';

const completionSteps = [
  {
    title: 'Capture experience & achievements',
    description: 'Share years of experience, standout projects, and what makes you a strong interview partner.',
    icon: <WorkOutlineIcon fontSize="large" />
  },
  {
    title: 'Document your skills & hobbies',
    description: 'List tech stacks, soft skills, and interests so admins can verify breadth before booking.',
    icon: <LayersIcon fontSize="large" />
  },
  {
    title: 'Upload resumes or bios',
    description: 'Students upload resumes while interviewers add a bio to showcase depth; admins can review immediately.',
    icon: <DescriptionIcon fontSize="large" />
  }
];

const ProfileCompletion = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);
  const role = auth.user?.role;
  const profile = auth.profile;

  const needsCompletion = !profile || ['draft', 'rejected'].includes(profile.profile_status);
  const engagementBadges = getBadges();

  useEffect(() => {
    if (auth.token) {
      dispatch(fetchProfile());
    }
  }, [auth.token, dispatch]);

  useEffect(() => {
    if (auth.token && role && !needsCompletion) {
      navigate(roleRoutes[role] || '/', { replace: true });
    }
  }, [auth.token, role, needsCompletion, navigate]);

  if (!auth.token) return <Navigate to="/" />;
  if (!['student', 'interviewer'].includes(role)) {
    return <Navigate to={roleRoutes[role] || '/'} />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack spacing={4}>
        <Paper
          elevation={4}
          sx={{
            p: 4,
            borderRadius: 4,
            background: 'linear-gradient(180deg, rgba(15,23,42,1) 0%, rgba(63,63,70,0.7) 100%)',
            border: '1px solid rgba(255,255,255,0.08)'
          }}
        >
          <Stack spacing={1}>
            <Typography variant="overline" letterSpacing={2} color="text.secondary">
              Role-specific onboarding
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              Finish your profile before admin approval
            </Typography>
            <Typography variant="body1" color="text.secondary">
              We fetch your latest profile the moment you log in so you can pick up where you left off.
              Complete every section, upload your resume or bio, and submit for review to unlock dashboards, bookings,
              and export-ready analytics.
            </Typography>
            <Chip
              label={needsCompletion ? 'Pending completion' : 'Ready to go'}
              color={needsCompletion ? 'warning' : 'success'}
              icon={<CheckCircleOutlineIcon />}
              sx={{ width: 'fit-content', mt: 2 }}
            />
          </Stack>
        </Paper>

        <Grid container spacing={2}>
          {completionSteps.map((step) => (
            <Grid item xs={12} md={4} key={step.title}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  minHeight: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {step.icon}
                    <Typography variant="h6" fontWeight="bold">
                      {step.title}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  We block dashboard routes until your profile reaches Pending Review.
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Stack spacing={2}>
          <Typography variant="h6">Engagement milestones</Typography>
          <Typography variant="body2" color="text.secondary">
            Finish the Kanban updates, claim badges through quizzes, and keep your profile up to date so admins can approve you faster.
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip label="HR Pipeline aligned" color="primary" />
            <Chip label="Quiz ready" variant={engagementBadges.length ? 'filled' : 'outlined'} />
            <Chip label="Profile verified" color={needsCompletion ? 'warning' : 'success'} onClick={() => navigate('/complete-profile')} />
          </Stack>
          {engagementBadges.length > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {engagementBadges.map((badge) => (
                <Chip key={badge} icon={<CheckCircleOutlineIcon />} label={badge} color="primary" />
              ))}
            </Stack>
          )}
        </Stack>

        <ProfileOnboarding role={role} />
      </Stack>
    </Container>
  );
};

export default ProfileCompletion;
