import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  fetchProfile,
  forgotPassword,
  loginUser,
  registerUser,
  resetPassword,
  resetPasswordFlows,
  resetVerification,
  verifyEmailOtp,
  verifyResetCode,
  resendVerificationCode
} from '../../store/authSlice';
import roleRoutes from '../../utils/roleRoutes';

const featureHighlights = [
  {
    title: 'Modern Landing Experience',
    copy: 'Hero copy with role-specific onboarding cues keeps visitors focused on their next milestone.',
    badge: 'New Hero'
  },
  {
    title: 'Guided Profile Completion',
    copy: 'Students and interviewers alike follow curated steps before admin approval unlocks bookings.',
    badge: 'Must Complete'
  },
  {
    title: 'Verified Outcomes',
    copy: 'Admins review status, export bookings/profiles, and keep teammate data aligned with rich exports.',
    badge: 'Admin Ops'
  }
];

const roleHighlights = {
  student: [
    'Capture experience, projects, hobbies, and skills in one view',
    'Upload your resume once and let admin verification open bookings',
    'Stay in the loop with instant profile fetching after login'
  ],
  interviewer: [
    'Share skill set, experience, and hobbies before bookings go live',
    'Admin verification ensures profile integrity before interviews',
    'Export-ready dashboards keep reporting clean and auditable'
  ],
  hr: ['Access candidate pools, download resumes, and manage subscriptions'],
  admin: ['Verify applicants, edit roster details, and export reports on demand']
};

const roles = [
  { value: 'student', label: 'Student' },
  { value: 'interviewer', label: 'Interviewer' }
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginRegister = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const [mode, setMode] = useState('login');
  const [otpCode, setOtpCode] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState('idle');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotFeedback, setForgotFeedback] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.token) {
      dispatch(fetchProfile());
    }
  }, [auth.token, dispatch]);
  const {
    handleSubmit,
    register,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: { email: '', password: '', role: 'student', rate: '', phone: '' }
  });
  const selectedRole = watch('role');
  const [currentRole, setCurrentRole] = useState(selectedRole);

  useEffect(() => {
    if (selectedRole) {
      setCurrentRole(selectedRole);
    }
  }, [selectedRole]);

  const heroRole = auth.user?.role || currentRole;
  const highlightRole = mode === 'register' ? currentRole : heroRole;

  useEffect(() => {
    if (auth.user?.role) {
      const targetPath = roleRoutes[auth.user.role] || '/';
      navigate(targetPath, { replace: true });
    }
  }, [auth.user?.role, navigate]);

  const showVerificationStep = mode === 'register' && Boolean(auth.pendingVerificationEmail);
  const isOtpValid = /^\d{6}$/.test(otpCode);
  const verificationEmail = auth.pendingVerificationEmail || watch('email');
  const resendStatus = auth.resendVerificationStatus;
  const resendMessage = auth.resendVerificationMessage || auth.verificationMessage;

  useEffect(() => {
    if (!showVerificationStep) {
      setOtpCode('');
    }
  }, [showVerificationStep]);

  useEffect(() => {
    setOtpCode('');
  }, [mode]);

  const toggleMode = () => {
    setMode((prevMode) => (prevMode === 'login' ? 'register' : 'login'));
    dispatch(resetVerification());
  };

  const onSubmit = async (form) => {
    if (mode === 'login') {
      dispatch(loginUser(form));
      return;
    }
    if (showVerificationStep) return;
    const { rate, ...rest } = form;
    const profile = {};
    if (rest.role === 'interviewer') {
      const parsedRate = Number(rate);
      if (!Number.isNaN(parsedRate)) {
        profile.rate = parsedRate;
      }
    }
    await dispatch(registerUser({ ...rest, profile }));
  };

  const handleVerifyCode = async () => {
    if (!isOtpValid) return;
    try {
      await dispatch(
        verifyEmailOtp({
          email: auth.pendingVerificationEmail || watch('email'),
          code: otpCode
        })
      ).unwrap();
      setOtpCode('');
    } catch (err) {
      // error already handled via slice
    }
  };

  const handleResendVerificationCode = async () => {
    if (!verificationEmail) return;
    try {
      await dispatch(resendVerificationCode({ email: verificationEmail })).unwrap();
    } catch (err) {
      // slice handles the error message
    }
  };

  const resetForgotForm = () => {
    setForgotStep('idle');
    setForgotCode('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotFeedback(null);
  };

  const handleShowForgot = () => {
    resetForgotForm();
    setForgotEmail(watch('email') || '');
    setShowForgot(true);
    dispatch(resetPasswordFlows());
  };

  const handleHideForgot = () => {
    setShowForgot(false);
    resetForgotForm();
    setForgotEmail('');
    dispatch(resetPasswordFlows());
  };

  const handleSendResetCode = async () => {
    setForgotFeedback(null);
    if (!forgotEmail) {
      setForgotFeedback({ type: 'error', text: 'Enter the email that needs a reset code.' });
      return;
    }
    if (!EMAIL_REGEX.test(forgotEmail)) {
      setForgotFeedback({ type: 'error', text: 'Provide a valid email address.' });
      return;
    }
    try {
      const response = await dispatch(forgotPassword({ email: forgotEmail })).unwrap();
      setForgotFeedback({ type: 'success', text: response?.message || 'Reset code sent to that email.' });
      setForgotStep('codeSent');
    } catch (err) {
      setForgotFeedback({ type: 'error', text: err });
    }
  };

  const handleVerifyResetCode = async () => {
    setForgotFeedback(null);
    if (!/^\d{6}$/.test(forgotCode)) {
      setForgotFeedback({ type: 'error', text: 'Enter the 6-digit code from your inbox.' });
      return;
    }
    try {
      const response = await dispatch(verifyResetCode({ email: forgotEmail, code: forgotCode })).unwrap();
      setForgotFeedback({ type: 'success', text: response?.message || 'Code verified. Set a new password.' });
      setForgotStep('verified');
    } catch (err) {
      setForgotFeedback({ type: 'error', text: err });
    }
  };

  const handleResetPassword = async () => {
    if (forgotStep !== 'verified') {
      setForgotFeedback({ type: 'error', text: 'Verify the OTP before changing your password.' });
      return;
    }
    setForgotFeedback(null);
    if (!forgotNewPassword) {
      setForgotFeedback({ type: 'error', text: 'Provide a new password.' });
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotFeedback({ type: 'error', text: 'New passwords must match.' });
      return;
    }
    try {
      const response = await dispatch(
        resetPassword({ email: forgotEmail, code: forgotCode, password: forgotNewPassword })
      ).unwrap();
      setForgotFeedback({ type: 'success', text: response?.message || 'Password updated. Please login.' });
      setForgotStep('done');
      setForgotCode('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
    } catch (err) {
      setForgotFeedback({ type: 'error', text: err });
    }
  };

  const onFormSubmit = (event) => {
    if (showForgot) {
      event.preventDefault();
      return;
    }
    handleSubmit(onSubmit)(event);
  };

  useEffect(() => {
    if (mode !== 'login' && showForgot) {
      setShowForgot(false);
      resetForgotForm();
      setForgotEmail('');
      dispatch(resetPasswordFlows());
    }
  }, [mode, showForgot, dispatch]);

  return (
    <Box sx={{ flexGrow: 1, position: 'relative' }}>
      <Grid container justifyContent="center" sx={{ px: 2, pt: 6 }}>
        <Grid item xs={12} md={10}>
          <Grid container spacing={6} alignItems="stretch">
            <Grid item xs={12} md={7}>
              <Paper className="hero-card" elevation={4}>
                <Typography variant="h3" fontWeight={700} gutterBottom>
                  Launch your interview journey with polished onboarding
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  A landing page that doubles as {highlightRole || 'role'}-specific onboarding keeps candidates,
                  interviewers, and admins aligned. Complete the profile, upload a resume, and wait for admin verification
                  before exploring the dashboard.
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                  {['role-specific', 'verified', 'export-ready'].map((label) => (
                    <Chip key={label} label={label} className="hero-chip" />
                  ))}
                </Stack>
                <Stack spacing={1.5}>
                  {roleHighlights[highlightRole]?.map((item) => (
                    <Paper key={item} elevation={0} className="hero-highlight">
                      <Typography variant="body2">{item}</Typography>
                    </Paper>
                  ))}
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} md={5}>
              <Paper className="auth-card" elevation={6}>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  {showForgot ? 'Forgot password' : mode === 'login' ? 'Login' : 'Register'}
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Box component="form" onSubmit={onFormSubmit}>
                  {showForgot ? (
                    <Stack spacing={2}>
                      <Typography variant="body2" color="text.secondary">
                        Enter the email associated with your account to receive a 6-digit code and reset
                        your password.
                      </Typography>
                      <TextField
                        label="Email"
                        type="email"
                        value={forgotEmail}
                        onChange={(event) => setForgotEmail(event.target.value)}
                        fullWidth
                      />
                      <Button
                        variant="contained"
                        onClick={handleSendResetCode}
                        disabled={auth.forgotStatus === 'loading'}
                        sx={{
                          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                          boxShadow: '0 4px 14px rgba(168, 85, 247, 0.4)',
                          transition: 'all 0.3s ease',
                          '&:hover': { boxShadow: '0 6px 20px rgba(168, 85, 247, 0.6)', transform: 'translateY(-2px)' }
                        }}
                      >
                        {auth.forgotStatus === 'loading' ? 'Sending code…' : 'Send reset code'}
                      </Button>
                      {forgotFeedback && (
                        <Typography
                          variant="body2"
                          color={forgotFeedback.type === 'error' ? 'error' : 'success.main'}
                        >
                          {forgotFeedback.text}
                        </Typography>
                      )}
                      {forgotStep === 'codeSent' && (
                      <Stack spacing={2}>
                        <TextField
                          label="Verification code"
                          value={forgotCode}
                            onChange={(event) => setForgotCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                            inputProps={{ inputMode: 'numeric', pattern: '\\d*', maxLength: 6 }}
                            fullWidth
                          />
                        <Button
                          variant="contained"
                          onClick={handleVerifyResetCode}
                          disabled={auth.verifyResetStatus === 'loading'}
                            sx={{
                              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                              boxShadow: '0 4px 14px rgba(168, 85, 247, 0.4)',
                              transition: 'all 0.3s ease',
                              '&:hover': { boxShadow: '0 6px 20px rgba(168, 85, 247, 0.6)', transform: 'translateY(-2px)' }
                            }}
                          >
                            {auth.verifyResetStatus === 'loading' ? 'Verifying code…' : 'Verify code'}
                          </Button>
                      </Stack>
                    )}
                    {forgotStep === 'verified' && (
                        <Stack spacing={2}>
                          <TextField
                            label="New password"
                            type="password"
                            value={forgotNewPassword}
                            onChange={(event) => setForgotNewPassword(event.target.value)}
                            fullWidth
                          />
                          <TextField
                            label="Confirm new password"
                            type="password"
                            value={forgotConfirmPassword}
                            onChange={(event) => setForgotConfirmPassword(event.target.value)}
                            fullWidth
                          />
                          <Button
                            variant="contained"
                            onClick={handleResetPassword}
                            disabled={auth.resetStatus === 'loading'}
                            sx={{
                              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                              boxShadow: '0 4px 14px rgba(168, 85, 247, 0.4)',
                              transition: 'all 0.3s ease',
                              '&:hover': { boxShadow: '0 6px 20px rgba(168, 85, 247, 0.6)', transform: 'translateY(-2px)' }
                            }}
                          >
                            {auth.resetStatus === 'loading' ? 'Resetting…' : 'Reset password'}
                          </Button>
                        </Stack>
                      )}
                      {forgotStep === 'done' && (
                        <Typography variant="body2" color="success.main">
                          Password updated. You can now log in with the new password.
                        </Typography>
                      )}
                      <Button
                        variant="text"
                        onClick={handleHideForgot}
                        sx={{
                          color: '#a5b4fc',
                          transition: 'all 0.3s ease',
                          '&:hover': { color: '#ffffff', background: 'rgba(255,255,255,0.05)' }
                        }}
                      >
                        Back to login
                      </Button>
                    </Stack>
                  ) : (
                    <>
                      <Stack spacing={2}>
                        <TextField
                          label="Email"
                          type="email"
                          disabled={showVerificationStep}
                          fullWidth
                          error={!!errors.email}
                          helperText={errors.email?.message}
                          {...register('email', {
                            required: 'Email is required',
                            pattern: {
                              value: EMAIL_REGEX,
                              message: 'Enter a valid email address'
                            }
                          })}
                        />
                        <TextField
                          label="Password"
                          type={showPassword ? 'text' : 'password'}
                          {...register('password', { required: 'Password required' })}
                          fullWidth
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                  {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            )
                          }}
                        />
                        {mode === 'register' && (
                          <TextField
                            label="Mobile number"
                            type="tel"
                            fullWidth
                            error={!!errors.phone}
                            helperText={errors.phone?.message}
                            {...register('phone', { required: 'Mobile number required' })}
                          />
                        )}
                        {mode === 'register' && (
                          <>
                            <TextField select label="Role" {...register('role')} fullWidth SelectProps={{ native: true }}>
                              {roles.map((role) => (
                                <option key={role.value} value={role.value}>
                                  {role.label}
                                </option>
                              ))}
                            </TextField>
                            {currentRole === 'interviewer' && (
                              <TextField
                                label="Session rate (USD)"
                                type="number"
                                {...register('rate')}
                                fullWidth
                                helperText="Set how much you charge per session"
                              />
                            )}
                          </>
                        )}
                        {auth.error && (
                          <Typography color="error" variant="body2">
                            {auth.error}
                          </Typography>
                        )}
                        {!showVerificationStep && (
                          <Button
                            variant="contained"
                            type="submit"
                            disabled={auth.status === 'loading'}
                            sx={{
                              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                              boxShadow: '0 4px 14px rgba(168, 85, 247, 0.4)',
                              transition: 'all 0.3s ease',
                              '&:hover': { boxShadow: '0 6px 20px rgba(168, 85, 247, 0.6)', transform: 'translateY(-2px)' }
                            }}
                          >
                            {mode === 'login' ? 'Login' : 'Create account'}
                          </Button>
                        )}
                        <Button
                          variant="text"
                          onClick={toggleMode}
                          sx={{ color: '#a5b4fc', transition: 'all 0.3s ease', '&:hover': { color: '#ffffff', background: 'rgba(255,255,255,0.05)' } }}
                        >
                          Switch to {mode === 'login' ? 'Register' : 'Login'}
                        </Button>
                        {mode === 'login' && !showVerificationStep && (
                          <Button
                            variant="text"
                            onClick={handleShowForgot}
                            sx={{ color: '#a5b4fc', transition: 'all 0.3s ease', '&:hover': { color: '#ffffff', background: 'rgba(255,255,255,0.05)' } }}
                          >
                            Forgot password?
                          </Button>
                        )}
                      </Stack>
                      {showVerificationStep && (
                        <Stack spacing={1} sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            We sent a 6-digit code to <strong>{verificationEmail}</strong>. Enter it below to
                            complete your registration.
                          </Typography>
                          {resendMessage && (
                            <Typography variant="caption" color="text.secondary">
                              {resendMessage}
                            </Typography>
                          )}
                          <TextField
                            label="Verification code"
                            value={otpCode}
                            onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                            inputProps={{ inputMode: 'numeric', pattern: '\\d*', maxLength: 6 }}
                          />
                          {auth.verificationError && (
                            <Typography color="error" variant="body2">
                              {auth.verificationError}
                            </Typography>
                          )}
                          <Button
                            variant="contained"
                            color="success"
                            type="button"
                            disabled={!isOtpValid || auth.verificationStatus === 'loading'}
                            onClick={handleVerifyCode}
                          >
                            {auth.verificationStatus === 'loading' ? 'Verifying…' : 'Verify OTP'}
                          </Button>
                          <Button
                            variant="text"
                            onClick={handleResendVerificationCode}
                            disabled={resendStatus === 'loading'}
                            sx={{ justifyContent: 'flex-start' }}
                          >
                            {resendStatus === 'loading' ? 'Resending code…' : 'Resend code'}
                          </Button>
                          {auth.resendVerificationError && (
                            <Typography color="error" variant="body2">
                              {auth.resendVerificationError}
                            </Typography>
                          )}
                        </Stack>
                      )}
                    </>
                  )}
                </Box>
                <Typography variant="caption" display="block" align="center" sx={{ mt: 2 }}>
                  Profile data is fetched immediately after login so you can continue onboarding without waiting.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          <Grid container spacing={3} sx={{ mt: 6 }}>
            {featureHighlights.map((feature) => (
              <Grid item key={feature.title} xs={12} md={4}>
                <Paper className="feature-card" elevation={2}>
                  <Chip label={feature.badge} size="small" className="feature-chip" />
                  <Typography variant="h6" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.copy}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LoginRegister;
