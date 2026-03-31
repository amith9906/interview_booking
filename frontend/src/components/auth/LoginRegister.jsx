import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import {
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
  IconButton,
  InputAdornment
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Visibility, VisibilityOff } from '@mui/icons-material';
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

  const primaryCtaGradient = {
    background: 'linear-gradient(135deg, #ff2d2d 0%, #ff6b6b 100%)',
    boxShadow: '0 4px 24px rgba(255, 0, 0, 0.2)',
    '&:hover': {
      background: 'linear-gradient(135deg, #ff4d4d 0%, #ff8a8a 100%)',
      boxShadow: '0 6px 28px rgba(255, 0, 0, 0.28)'
    }
  };

  const authInputSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: 'rgba(245, 247, 250, 0.8)',
      borderRadius: 2,
      '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.1)' },
      '&:hover fieldset': { borderColor: 'rgba(255, 59, 59, 0.3)' },
      '&.Mui-focused fieldset': { borderColor: 'rgba(255, 59, 59, 0.55)' }
    }
  };

  return (
    <Container
      maxWidth="xl"
      className="login-page-shell"
      sx={{
        flexGrow: 1,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: { xs: 'auto', md: 'calc(100vh - 64px)' },
        py: { xs: 3, md: 4 },
        boxSizing: 'border-box'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          gap: { xs: 4, md: 6, lg: 10 },
          width: '100%'
        }}
      >
        <Box
          sx={{
            flex: { md: '2 1 0' },
            minWidth: 0,
            pr: { md: 1 },
            zIndex: 1
          }}
        >
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.85rem', sm: '2.25rem', md: '2.75rem', lg: '3.25rem' },
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              color: '#111111',
              mb: 2
            }}
          >
            Launch your interview journey with polished onboarding
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#555555',
              maxWidth: 560,
              mb: 2.5,
              lineHeight: 1.65,
              fontSize: { xs: '0.95rem', md: '1.05rem' }
            }}
          >
            A landing flow that doubles as {highlightRole || 'role'}-specific onboarding keeps candidates, interviewers,
            and admins aligned. Complete your profile, upload a resume, and wait for admin verification before exploring
            the dashboard.
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3, gap: 1 }}>
            {['role-specific', 'verified', 'export-ready'].map((label) => (
              <Chip key={label} label={label} className="hero-chip" size="small" />
            ))}
          </Stack>
          <Stack spacing={1.5} sx={{ maxWidth: 620 }}>
            {roleHighlights[highlightRole]?.map((item) => (
              <Paper key={item} elevation={0} className="hero-highlight login-hero-highlight">
                <Typography variant="body2" sx={{ color: '#555555' }}>
                  {item}
                </Typography>
              </Paper>
            ))}
          </Stack>
        </Box>

        <Box
          sx={{
            flex: { md: '1 1 0' },
            width: { xs: '100%', md: 'auto' },
            maxWidth: { md: 420 },
            minWidth: { md: 300 },
            alignSelf: { md: 'stretch' },
            zIndex: 1
          }}
        >
          <Paper
            className="auth-card login-auth-card"
            elevation={0}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '20px',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              bgcolor: '#ffffff',
              backdropFilter: 'blur(20px)',
              p: { xs: 3, sm: 4 },
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)'
            }}
          >
            <Typography variant="h5" fontWeight={700} sx={{ color: '#111111', mb: 2.5 }}>
              {showForgot ? 'Forgot password' : mode === 'login' ? 'Login' : 'Register'}
            </Typography>
            <Box component="form" onSubmit={onFormSubmit} sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
                        sx={authInputSx}
                      />
                      <Button
                        variant="contained"
                        onClick={handleSendResetCode}
                        disabled={auth.forgotStatus === 'loading'}
                        sx={{ py: 1.25, ...primaryCtaGradient }}
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
                          sx={{ py: 1.25, ...primaryCtaGradient }}
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
                            sx={{ py: 1.25, ...primaryCtaGradient }}
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
                          color: '#ff3b3b',
                          transition: 'all 0.3s ease',
                          '&:hover': { color: '#cc0000', background: 'rgba(255, 0, 0, 0.04)' }
                        }}
                      >
                        Back to login
                      </Button>
                    </Stack>
                  ) : (
                    <>
                      <Stack spacing={2} sx={{ flex: 1 }}>
                        <TextField
                          type="email"
                          disabled={showVerificationStep}
                          fullWidth
                          error={!!errors.email}
                          helperText={errors.email?.message}
                          hiddenLabel={mode === 'login'}
                          label={mode === 'login' ? undefined : 'Email'}
                          placeholder={mode === 'login' ? 'Email' : undefined}
                          sx={authInputSx}
                          {...register('email', {
                            required: 'Email is required',
                            pattern: {
                              value: EMAIL_REGEX,
                              message: 'Enter a valid email address'
                            }
                          })}
                        />
                        <TextField
                          type={showPassword ? 'text' : 'password'}
                          {...register('password', { required: 'Password required' })}
                          fullWidth
                          hiddenLabel={mode === 'login'}
                          label={mode === 'login' ? undefined : 'Password'}
                          placeholder={mode === 'login' ? 'Password' : undefined}
                          sx={authInputSx}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => setShowPassword(!showPassword)}
                                  edge="end"
                                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                                  sx={{ color: 'rgba(85, 85, 85, 0.7)' }}
                                >
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
                            sx={authInputSx}
                            {...register('phone', { required: 'Mobile number required' })}
                          />
                        )}
                        {mode === 'register' && (
                          <>
                            <TextField
                              select
                              label="Role"
                              {...register('role')}
                              fullWidth
                              SelectProps={{ native: true }}
                              sx={authInputSx}
                            >
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
                                sx={authInputSx}
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
                            fullWidth
                            size="large"
                            disabled={auth.status === 'loading'}
                            sx={{ py: 1.35, mt: 0.5, fontWeight: 700, ...primaryCtaGradient }}
                          >
                            {mode === 'login' ? 'Login' : 'Create account'}
                          </Button>
                        )}
                        {!showVerificationStep && (
                          <Stack
                            direction="row"
                            spacing={2}
                            flexWrap="wrap"
                            justifyContent="center"
                            useFlexGap
                            sx={{ gap: 1, pt: 0.5 }}
                          >
                            <Button
                              variant="text"
                              onClick={toggleMode}
                              sx={{
                                color: '#ff3b3b',
                                textTransform: 'none',
                                fontWeight: 500,
                                '&:hover': { color: '#cc0000', bgcolor: 'rgba(255, 0, 0, 0.04)' }
                              }}
                            >
                              Switch to {mode === 'login' ? 'Register' : 'Login'}
                            </Button>
                            {mode === 'login' && (
                              <Button
                                variant="text"
                                onClick={handleShowForgot}
                                sx={{
                                  color: '#ff3b3b',
                                  textTransform: 'none',
                                  fontWeight: 500,
                                  '&:hover': { color: '#cc0000', bgcolor: 'rgba(255, 0, 0, 0.04)' }
                                }}
                              >
                                Forgot password?
                              </Button>
                            )}
                          </Stack>
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
            {!showForgot && (
              <Typography
                variant="caption"
                display="block"
                align="center"
                sx={{ mt: 'auto', pt: 2.5, color: '#555555', lineHeight: 1.5 }}
              >
                Profile data is fetched immediately after login so you can continue onboarding without waiting.
              </Typography>
            )}
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginRegister;
