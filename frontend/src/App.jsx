import { AppBar, Box, Button, Container, Toolbar, Typography, ThemeProvider, createTheme, CssBaseline, Stack, LinearProgress } from '@mui/material';
import { Routes, Route, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from './store/authSlice';
import AdminDashboard from './pages/AdminDashboard';
import HRDashboard from './pages/HRDashboard';
import InterviewerDashboard from './pages/InterviewerDashboard';
import ProfileCompletion from './pages/ProfileCompletion';
import StudentDashboard from './pages/StudentDashboard';
import LoginRegister from './components/auth/LoginRegister';
import NotificationPanel from './components/notifications/NotificationPanel';
import roleRoutes from './utils/roleRoutes';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#a855f7' },
    background: { paper: 'rgba(15, 23, 42, 0.8)', default: '#0f172a' },
    text: { primary: '#f8fafc', secondary: '#94a3b8' }
  },
  typography: { fontFamily: '"Inter", system-ui, -apple-system, sans-serif' },
  components: {
    MuiPaper: { 
      styleOverrides: { 
        root: { 
          backgroundImage: 'none', 
          backgroundColor: 'rgba(15, 23, 42, 0.6)', 
          backdropFilter: 'blur(24px)', 
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 16
        } 
      } 
    },
    MuiCard: { 
      styleOverrides: { 
        root: { 
          backgroundImage: 'none', 
          backgroundColor: 'rgba(15, 23, 42, 0.6)', 
          backdropFilter: 'blur(24px)', 
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
        } 
      } 
    },
    MuiAppBar: { 
      styleOverrides: { 
        root: { 
          backgroundImage: 'none', 
          backgroundColor: 'rgba(15, 23, 42, 0.8)', 
          backdropFilter: 'blur(24px)', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'none',
          borderRadius: 0
        } 
      } 
    },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 12 } } },
    MuiButton: { styleOverrides: { root: { borderRadius: 12, textTransform: 'none', fontWeight: 600 } } }
  }
});

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useSelector((state) => state.auth);
  const booking = useSelector((state) => state.booking);
  const userRole = auth.user?.role;

  const isLoading = auth.status === 'loading' || 
                    auth.profileStatus === 'loading' || 
                    booking.searchStatus === 'loading' || 
                    booking.bookingStatus === 'loading';

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const needsProfileCompletion = (role, profile) => {
    if (!['student', 'interviewer'].includes(role)) return false;
    if (!profile) return true;
    return ['draft', 'rejected'].includes(profile.profile_status);
  };
  const shouldCompleteProfile = needsProfileCompletion(userRole, auth.profile);

  const getHomeRoute = () => {
    if (!auth.token) return <LoginRegister />;
    if (shouldCompleteProfile) {
      return <Navigate to="/complete-profile" replace />;
    }
    return <Navigate to={roleRoutes[userRole] || '/'} replace />;
  };
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box className="landing-shell" sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="orbit orbit-three" />
        <AppBar position="sticky" sx={{ zIndex: 1100 }}>
          <Container maxWidth="xl">
            <Toolbar disableGutters sx={{ justifyContent: 'space-between', py: 0.5 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', cursor: 'pointer' }} onClick={() => navigate('/')} aria-label="Home">
                Interview Booking App
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {auth.token && <NotificationPanel />}
                {auth.token && (
                  <Button color="inherit" onClick={handleLogout} sx={{ '&:hover': { background: 'rgba(255,255,255,0.08)' } }} aria-label="Logout">
                    Logout
                  </Button>
                )}
                {!auth.token && location.pathname !== '/' && (
                  <Button component={Link} to="/" color="inherit" sx={{ '&:hover': { background: 'rgba(255,255,255,0.08)' } }} aria-label="Login">
                    Login
                  </Button>
                )}
              </Box>
            </Toolbar>
          </Container>
          {isLoading && <LinearProgress sx={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} />}
        </AppBar>
        {/* {auth.token && <NotificationPanel />} */}
        <Box component="main" sx={{ flexGrow: 1, position: 'relative', zIndex: 10 }}>
          <Routes>
            <Route path="/" element={getHomeRoute()} />
            <Route
              path="/student"
              element={
                !auth.token ? (
                  <Navigate to="/" />
                ) : shouldCompleteProfile ? (
                  <Navigate to="/complete-profile" />
                ) : (
                  <StudentDashboard />
                )
              }
            />
            <Route
              path="/interviewer"
              element={
                !auth.token ? (
                  <Navigate to="/" />
                ) : shouldCompleteProfile ? (
                  <Navigate to="/complete-profile" />
                ) : (
                  <InterviewerDashboard />
                )
              }
            />
            <Route
              path="/hr"
              element={
                auth.token && userRole === 'hr' ? (
                  <HRDashboard />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            <Route
              path="/admin"
              element={
                auth.token && userRole === 'admin' ? (
                  <AdminDashboard />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            <Route
              path="/complete-profile"
              element={
                !auth.token ? (
                  <Navigate to="/" />
                ) : shouldCompleteProfile ? (
                  <ProfileCompletion />
                ) : (
                  <Navigate to={roleRoutes[userRole] || '/'} />
                )
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
