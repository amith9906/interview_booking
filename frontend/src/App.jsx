import { AppBar, Box, Button, Container, Toolbar, ThemeProvider, createTheme, CssBaseline, Stack, LinearProgress } from '@mui/material';
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
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import ContactPage from './pages/ContactPage';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#ff3b3b' },
    background: { paper: '#ffffff', default: '#f5f7fa' },
    text: { primary: '#111111', secondary: '#555555' }
  },
  typography: { fontFamily: '"Inter", system-ui, -apple-system, sans-serif' },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#ffffff',
          backdropFilter: 'blur(6px)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          borderRadius: 16,
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#ffffff',
          backdropFilter: 'blur(6px)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          borderRadius: 16,
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)'
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: '0 1px 8px rgba(0, 0, 0, 0.04)',
          borderRadius: 0,
          color: '#111111'
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
    if (!auth.token) return <HomePage />;
    if (shouldCompleteProfile) {
      return <Navigate to="/complete-profile" replace />;
    }
    return <Navigate to={roleRoutes[userRole] || '/'} replace />;
  };

  const getDashboardRoute = () => {
    if (!auth.token) return '/login';
    return roleRoutes[userRole] || '/';
  };
  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <Box className="landing-shell" sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="orbit orbit-three" />
        <AppBar position="sticky" elevation={0} className="app-navbar" sx={{ zIndex: 1100, position: 'relative' }}>
          <Container maxWidth="xl">
            <Toolbar disableGutters sx={{ justifyContent: 'space-between', py: 0.75 }}>
              <Box
                component="button"
                type="button"
                className="app-navbar-logo"
                onClick={() => navigate('/')}
                aria-label="Home"
              >
                Interview
              </Box>
              <Box className="app-navbar-actions" sx={{ display: 'flex', gap: { xs: 0.25, sm: 0.5 }, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {auth.token && <NotificationPanel />}
                {!auth.token && (
                  <Stack direction="row" spacing={0.25} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
                    <Button component={Link} to="/" color="inherit" className="app-nav-link">
                      Home
                    </Button>
                    <Button component={Link} to="/services" color="inherit" className="app-nav-link">
                      Services
                    </Button>
                    <Button component={Link} to="/contact" color="inherit" className="app-nav-link">
                      Contact
                    </Button>
                  </Stack>
                )}
                {auth.token && (
                  <Button color="inherit" className="app-nav-link" onClick={() => navigate(getDashboardRoute())} aria-label="Dashboard">
                    Dashboard
                  </Button>
                )}
                {auth.token && (
                  <Button color="inherit" className="app-nav-link" onClick={handleLogout} aria-label="Logout">
                    Logout
                  </Button>
                )}
                {!auth.token && location.pathname !== '/login' && (
                  <Button component={Link} to="/login" color="inherit" className="app-nav-link app-nav-link--emphasis" aria-label="Login">
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
              path="/login"
              element={auth.token ? <Navigate to={getDashboardRoute()} replace /> : <LoginRegister />}
            />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/contact" element={<ContactPage />} />
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
