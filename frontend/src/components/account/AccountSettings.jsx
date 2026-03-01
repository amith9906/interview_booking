import { Alert, Button, Divider, Paper, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  changePassword,
  fetchProfile,
  requestEmailChange,
  updateProfile,
  verifyEmailChange
} from '../../store/authSlice';

const AccountSettings = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const profile = useSelector((state) => state.auth.profile);
  const changePasswordStatus = useSelector((state) => state.auth.changePasswordStatus);
  const [formValues, setFormValues] = useState({ name: '', phone: '', email: '', location: '', meeting_link: '' });
  const [accountFeedback, setAccountFeedback] = useState(null);
  const [emailFeedback, setEmailFeedback] = useState(null);
  const [saving, setSaving] = useState(false);
  const [requestingEmail, setRequestingEmail] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [emailStage, setEmailStage] = useState('idle');
  const [verificationCode, setVerificationCode] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState(null);

  const canEditProfile = ['student', 'interviewer'].includes(user?.role);

  useEffect(() => {
    if (!user) return;
    setFormValues({
      name: user.name || '',
      phone: user.phone || '',
      email: user.email || '',
      location: profile?.location || '',
      meeting_link: profile?.meeting_link || ''
    });
    setEmailStage('idle');
    setVerificationCode('');
    setEmailFeedback(null);
  }, [user, profile]);

  const handleFieldChange = (field) => (event) => {
    const value = event.target.value;
    setFormValues((prev) => ({ ...prev, [field]: value }));
    if (field === 'email') {
      setEmailStage('idle');
      setVerificationCode('');
      setEmailFeedback(null);
    }
  };

  const handleSaveAccount = async () => {
    if (!user || !canEditProfile) return;
    const updates = {};
    const trimmedName = formValues.name.trim();
    const trimmedPhone = formValues.phone.trim();
    if (trimmedName && trimmedName !== user.name) {
      updates.name = trimmedName;
    }
    if (trimmedPhone && trimmedPhone !== user.phone) {
      updates.phone = trimmedPhone;
    }
    const trimmedLocation = formValues.location.trim();
    const currentLocation = profile?.location?.trim() || '';
    if (trimmedLocation !== currentLocation) {
      updates.location = trimmedLocation || null;
    }
    if (user?.role === 'interviewer') {
      const trimmedLink = formValues.meeting_link.trim();
      const currentLink = profile?.meeting_link?.trim() || '';
      if (trimmedLink !== currentLink) {
        updates.meeting_link = trimmedLink || null;
      }
    }
    if (!Object.keys(updates).length) {
      setAccountFeedback({ type: 'info', text: 'No changes to save yet.' });
      return;
    }

    setSaving(true);
    setAccountFeedback(null);
    try {
      await dispatch(updateProfile(updates)).unwrap();
      await dispatch(fetchProfile()).unwrap();
      setAccountFeedback({ type: 'success', text: 'Account details updated.' });
    } catch (error) {
      setAccountFeedback({ type: 'error', text: error || 'Unable to save account details.' });
    } finally {
      setSaving(false);
    }
  };

  const handleRequestEmailChange = async () => {
    if (!user) return;
    const targetEmail = formValues.email.trim();
    if (!targetEmail) {
      setEmailFeedback({ type: 'error', text: 'Enter the new email address.' });
      return;
    }
    if (targetEmail === user.email) {
      setEmailFeedback({ type: 'info', text: 'This email is already active.' });
      return;
    }
    setRequestingEmail(true);
    setEmailFeedback(null);
    try {
      const response = await dispatch(requestEmailChange({ email: targetEmail })).unwrap();
      setEmailStage('requested');
      setEmailFeedback({ type: 'success', text: response?.message || 'Verification code sent to the new email.' });
    } catch (error) {
      setEmailFeedback({ type: 'error', text: error });
    } finally {
      setRequestingEmail(false);
    }
  };

  const handleVerifyEmailChange = async () => {
    if (!verificationCode.trim()) {
      setEmailFeedback({ type: 'error', text: 'Enter the verification code sent to your new email.' });
      return;
    }
    setVerifyingEmail(true);
    setEmailFeedback(null);
    try {
      const response = await dispatch(verifyEmailChange({ code: verificationCode.trim() })).unwrap();
      setEmailFeedback({ type: 'success', text: response?.message || 'Email updated.' });
      setEmailStage('idle');
      setVerificationCode('');
      await dispatch(fetchProfile()).unwrap();
    } catch (error) {
      setEmailFeedback({ type: 'error', text: error });
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim()) {
      setPasswordFeedback({ type: 'error', text: 'Enter both current and new passwords.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', text: 'New passwords must match.' });
      return;
    }
    setPasswordFeedback(null);
    try {
      const response = await dispatch(changePassword({ currentPassword, newPassword })).unwrap();
      setPasswordFeedback({ type: 'success', text: response?.message || 'Password updated.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordFeedback({ type: 'error', text: error });
    }
  };

  if (!user) return null;

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h6" gutterBottom>
        Account settings
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Keep your display name, phone, and email up to date so admins and teammates can reach you easily.
      </Typography>
      {canEditProfile && (
        <>
          <Stack spacing={2}>
            <TextField label="Display name" value={formValues.name} onChange={handleFieldChange('name')} fullWidth />
            <TextField label="Phone" type="tel" value={formValues.phone} onChange={handleFieldChange('phone')} fullWidth />
          {user?.role === 'student' && (
            <TextField
              label="Job location"
              value={formValues.location}
              onChange={handleFieldChange('location')}
              fullWidth
            />
          )}
          {user?.role === 'interviewer' && (
            <TextField
              label="Meeting link (Google Meet)"
              value={formValues.meeting_link}
              onChange={handleFieldChange('meeting_link')}
              helperText="Share the meeting URL students should use"
              fullWidth
            />
          )}
            <Button variant="contained" onClick={handleSaveAccount} disabled={saving}>
              {saving ? 'Saving…' : 'Save personal info'}
            </Button>
            {accountFeedback && <Alert severity={accountFeedback.type}>{accountFeedback.text}</Alert>}
          </Stack>
          <Divider sx={{ my: 2 }} />
        </>
      )}
      {!canEditProfile && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Profile edits (name & phone) are available to students and interviewers only.
        </Typography>
      )}
      <Stack spacing={2}>
        <Typography variant="subtitle1">Email</Typography>
        <Typography variant="body2" color="text.secondary">
          Email changes trigger a verification code that is sent to the new address before the update is complete.
        </Typography>
        <TextField label="Email" type="email" value={formValues.email} onChange={handleFieldChange('email')} fullWidth />
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Button
            variant="outlined"
            onClick={handleRequestEmailChange}
            disabled={requestingEmail || formValues.email.trim() === user.email}
          >
            {emailStage === 'requested' ? 'Resend code' : 'Send verification code'}
          </Button>
          {emailStage === 'requested' && (
            <Button
              variant="contained"
              onClick={handleVerifyEmailChange}
              disabled={verifyingEmail || !verificationCode.trim()}
            >
              {verifyingEmail ? 'Verifying…' : 'Verify & update email'}
            </Button>
          )}
        </Stack>
        {emailStage === 'requested' && (
          <TextField
            label="Verification code"
            value={verificationCode}
            onChange={(event) => setVerificationCode(event.target.value)}
            fullWidth
          />
        )}
        {emailFeedback && <Alert severity={emailFeedback.type}>{emailFeedback.text}</Alert>}
      </Stack>
      <Divider sx={{ my: 2 }} />
      <Stack spacing={2}>
        <Typography variant="subtitle1">Change password</Typography>
        <Typography variant="body2" color="text.secondary">
          Set a new password for your account. This is available to all roles.
        </Typography>
        <TextField
          label="Current password"
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          fullWidth
        />
        <TextField
          label="New password"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          fullWidth
        />
        <TextField
          label="Confirm new password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          fullWidth
        />
        <Button
          variant="contained"
          onClick={handleChangePassword}
          disabled={changePasswordStatus === 'loading'}
        >
          {changePasswordStatus === 'loading' ? 'Changing password…' : 'Change password'}
        </Button>
        {passwordFeedback && <Alert severity={passwordFeedback.type}>{passwordFeedback.text}</Alert>}
      </Stack>
    </Paper>
  );
};

export default AccountSettings;
