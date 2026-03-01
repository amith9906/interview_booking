import { useEffect, useState } from 'react';
import { Button, Paper, Stack, TextField, Typography } from '@mui/material';
import api from '../../utils/api';

const ProfileVerificationPanel = () => {
  const [pending, setPending] = useState({ students: [], interviewers: [] });
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});
  const [actionId, setActionId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [actionMessage, setActionMessage] = useState('');
  const [actionStatus, setActionStatus] = useState('success');

  const loadPending = async () => {
    setLoading(true);
    setActionMessage('');
    try {
      const response = await api.get('/admin/profiles/pending');
      setPending(response.data);
      setActionStatus('success');
    } catch (err) {
      setActionMessage(err?.message || 'Unable to load pending profiles');
      setActionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleAction = async (role, profile, status) => {
    setActionId(profile.id);
    setActionMessage('');
    try {
      await api.patch(`/admin/profiles/${role}/${profile.id}`, {
        status,
        notes: status === 'rejected' ? notes[profile.id] : undefined
      });
      setActionMessage(`${profile.User?.name || profile.name} ${status} successfully.`);
      setActionStatus('success');
      loadPending();
    } catch (err) {
      setActionMessage(err?.message || 'Unable to update profile');
      setActionStatus('error');
    } finally {
      setActionId(null);
    }
  };

  const handleToggleActive = async (role, profile) => {
    setActiveId(profile.id);
    setActionMessage('');
    try {
      await api.patch(`/admin/profiles/${role}/${profile.id}/active`, {
        active: !profile.is_active
      });
      setActionMessage(
        `${profile.User?.name || profile.name} is now ${profile.is_active ? 'paused' : 'active'}.`
      );
      setActionStatus('success');
      loadPending();
    } catch (err) {
      setActionMessage(err?.message || 'Unable to update active state');
      setActionStatus('error');
    } finally {
      setActiveId(null);
    }
  };

  const renderRow = (role, profile) => (
    <Paper key={`${role}-${profile.id}`} variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle1">{profile.User?.name || 'Name not set'}</Typography>
      <Typography variant="body2" color="text.secondary">
        {profile.User?.email}
      </Typography>
      {profile.resume_file && (
        <Button
          component="a"
          href={profile.resume_file}
          target="_blank"
          rel="noreferrer"
          size="small"
          sx={{ mt: 1 }}
        >
          View resume / documents
        </Button>
      )}
      <Typography variant="body2" sx={{ mt: 1 }}>
        {role === 'student' ? 'Skills:' : 'Skill set:'} {role === 'student' ? profile.skills?.join(', ') : profile.skill_set?.join(', ')}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5 }}>
        Hobbies: {profile.hobbies?.join(', ') || '—'}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5 }}>
        Status: {profile.profile_status} · Active: {profile.is_active ? 'Yes' : 'No'}
      </Typography>
      <TextField
        variant="outlined"
        fullWidth
        placeholder="Optional rejection notes"
        helperText="Use only if you reject the profile"
        value={notes[profile.id] || ''}
        onChange={(event) => setNotes((prev) => ({ ...prev, [profile.id]: event.target.value }))}
        sx={{ mt: 2 }}
      />
      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Button
          variant="contained"
          size="small"
          onClick={() => handleAction(role, profile, 'approved')}
          disabled={loading || actionId === profile.id}
        >
          Approve
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={() => handleAction(role, profile, 'rejected')}
          disabled={loading || actionId === profile.id}
        >
          Reject
        </Button>
        <Button
          variant="text"
          size="small"
          onClick={() => handleToggleActive(role, profile)}
          disabled={loading || activeId === profile.id}
        >
          {profile.is_active ? 'Pause profile' : 'Activate profile'}
        </Button>
      </Stack>
    </Paper>
  );

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" mb={1}>
        Profile Verification Queue
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Students and interviewers flagged as pending are shown here so admins can approve or reject based on uploaded details.
      </Typography>
      {actionMessage && (
        <Typography variant="body2" color={actionStatus === 'error' ? 'error.main' : 'success.main'} mb={2}>
          {actionMessage}
        </Typography>
      )}
      {loading && <Typography variant="body2">Loading profiles…</Typography>}
      {!loading && (
        <Stack spacing={2}>
          {pending.students.length > 0 && (
            <>
              <Typography variant="subtitle2">Students waiting for verification</Typography>
              {pending.students.map((student) => renderRow('student', student))}
            </>
          )}
          {pending.interviewers.length > 0 && (
            <>
              <Typography variant="subtitle2">Interviewer approvals</Typography>
              {pending.interviewers.map((interviewer) => renderRow('interviewer', interviewer))}
            </>
          )}
          {!pending.students.length && !pending.interviewers.length && (
            <Typography variant="body2" color="text.secondary">
              No profiles pending review.
            </Typography>
          )}
        </Stack>
      )}
    </Paper>
  );
};

export default ProfileVerificationPanel;
