import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Alert, Box, Button, Divider, LinearProgress, Paper, Stack, TextField, Typography } from '@mui/material';
import api from '../../utils/api';
import { fetchProfile, updateProfile } from '../../store/authSlice';

const ProfileOnboarding = ({ role }) => {
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.auth.profile);
  const profileStatus = useSelector((state) => state.auth.profileStatus);
  const [formState, setFormState] = useState({
    experience_years: '',
    skills: '',
    hobbies: '',
    projects: '',
    bio: '',
    rate: '',
    meeting_link: ''
  });
  const [statusMessage, setStatusMessage] = useState('');
  const [resumeStatus, setResumeStatus] = useState('idle');
  const [resumePreviewLoading, setResumePreviewLoading] = useState(false);

  const initialValues = useMemo(() => {
    const serializedProjects = Array.isArray(profile?.projects)
      ? profile.projects
        .map((project) => {
          if (typeof project === 'string') return project;
          const title = project.title || project.name;
          const description = project.description || project.details || '';
          return title ? `${title}${description ? ' - ' + description : ''}` : description;
        })
        .filter(Boolean)
        .join('\n')
      : '';
    const skills = role === 'student' ? profile?.skills : profile?.skill_set;
      return {
        experience_years: profile?.experience_years ?? '',
        skills: Array.isArray(skills) ? skills.join(', ') : skills ?? '',
        hobbies: Array.isArray(profile?.hobbies) ? profile.hobbies.join(', ') : profile?.hobbies ?? '',
        projects: serializedProjects,
        bio: profile?.bio ?? '',
        rate: profile?.rate ?? '',
        meeting_link: profile?.meeting_link ?? ''
      };
  }, [profile, role]);

  useEffect(() => {
    setFormState(initialValues);
  }, [initialValues]);

  useEffect(() => {
    if (profileStatus === 'succeeded') {
      setStatusMessage('Profile submitted for admin review.');
    } else if (profileStatus === 'failed') {
      setStatusMessage('Unable to save profile. Please try again.');
    } else {
      setStatusMessage('');
    }
  }, [profileStatus]);

  const handleChange = (field) => (event) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async () => {
    const payload = {};
    const years = Number(formState.experience_years);
    if (!Number.isNaN(years)) payload.experience_years = years;
    if (formState.skills) payload.skills = formState.skills;
    if (formState.hobbies) payload.hobbies = formState.hobbies;
    if (formState.projects) payload.projects = formState.projects;
    if (role === 'interviewer') {
      if (formState.bio) payload.bio = formState.bio;
      const parsedRate = Number(formState.rate);
      if (!Number.isNaN(parsedRate)) payload.rate = parsedRate;
      if (formState.meeting_link?.trim()) {
        payload.meeting_link = formState.meeting_link.trim();
      }
    }
    if (!Object.keys(payload).length) {
      setStatusMessage('Add some profile details before submitting.');
      return;
    }

    setStatusMessage('');
    try {
      await dispatch(updateProfile(payload)).unwrap();
      setStatusMessage('Profile saved. Waiting for verification.');
    } catch (err) {
      setStatusMessage(err || 'Unable to save profile.');
    }
  };

  const handleResumePreview = async () => {
    setResumePreviewLoading(true);
    try {
      const { data } = await api.get('/upload/resume/preview');
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch {
      setStatusMessage('Could not load resume preview. Please try again.');
    } finally {
      setResumePreviewLoading(false);
    }
  };

  const handleResumeUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('resume', file);
    setResumeStatus('uploading');
    try {
      const { data } = await api.post('/upload/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResumeStatus('done');
      await dispatch(fetchProfile());

      if (data?.extractedData) {
        // Wait for fetchProfile to complete its Redux cycle and reset formState, then apply the extracted data
        setTimeout(() => {
          setFormState((prev) => ({
            ...prev,
            experience_years: prev.experience_years || data.extractedData.experience_years || '',
            skills: data.extractedData.skills 
              ? (prev.skills ? `${prev.skills}, ${data.extractedData.skills}` : data.extractedData.skills)
              : prev.skills,
            projects: data.extractedData.projects 
              ? (prev.projects ? `${prev.projects}\n\n${data.extractedData.projects}` : data.extractedData.projects)
              : prev.projects
          }));
          setStatusMessage('Successfully extracted details from your resume! Please review and submit.');
        }, 500);
      }
    } catch (err) {
      setResumeStatus('error');
    }
  };

  const statusChip = () => {
    if (!profile) return null;
    if (profile.profile_status === 'pending_review') {
      const submissionDate = profile.profile_submitted_at
        ? new Date(profile.profile_submitted_at).toLocaleDateString()
        : 'recently';
      return <Alert severity="info">Profile submitted on {submissionDate}.</Alert>;
    }
    if (profile.profile_status === 'rejected') {
      return (
        <Alert severity="error">Profile rejected: {profile.profile_rejected_reason || 'Update and resubmit.'}</Alert>
      );
    }
    if (profile.profile_status === 'approved') {
      return <Alert severity="success">Profile approved. You can now access the full dashboard.</Alert>;
    }
    return <Alert severity="warning">Complete experience, projects, hobbies, skills and resume for admin approval.</Alert>;
  };

  if (!profile) return null;

  return (
    <Paper sx={{ p: 4, mb: 4 }}>
      <Typography variant="h5" mb={1}>{role === 'student' ? 'Student Profile' : 'Interviewer Profile'}</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Complete the fields below so admins can verify your profile.
      </Typography>
      {statusChip()}
      {profileStatus === 'loading' && <LinearProgress sx={{ mt: 2, mb: 2 }} />}
      <Stack spacing={2} mt={2}>
        <TextField
          label="Experience Years"
          type="number"
          value={formState.experience_years}
          onChange={handleChange('experience_years')}
        />
        <TextField
          label={role === 'student' ? 'Skills (comma separated)' : 'Skill set'}
          value={formState.skills}
          onChange={handleChange('skills')}
          helperText="Add comma separated skills"
        />
        <TextField
          label="Hobbies"
          value={formState.hobbies}
          onChange={handleChange('hobbies')}
          helperText="List hobbies or interests"
        />
        <TextField
          label="Projects"
          multiline
          minRows={3}
          value={formState.projects}
          onChange={handleChange('projects')}
          helperText="One project per line (Title - Description)"
        />
        {role === 'interviewer' && (
          <TextField
            label="Bio"
            multiline
            minRows={3}
            value={formState.bio}
            onChange={handleChange('bio')}
          />
        )}
        {role === 'interviewer' && (
          <TextField
            label="Session rate (USD)"
            type="number"
            value={formState.rate}
            onChange={handleChange('rate')}
            helperText="Set how much you charge per session"
          />
        )}
        {role === 'interviewer' && (
          <TextField
            label="Meeting link (Google Meet)"
            value={formState.meeting_link}
            onChange={handleChange('meeting_link')}
            helperText="Add the meeting URL that students can use"
            fullWidth
          />
        )}
        <Stack direction="row" spacing={2} alignItems="center">
          {role === 'student' && (
            <>
              <Button component="label" variant="outlined">
                Upload Resume
                <input type="file" hidden onChange={handleResumeUpload} accept=".pdf,.doc,.docx" />
              </Button>
              <Typography variant="caption" color="text.secondary">
                {profile.resume_file ? 'Resume uploaded' : 'No resume yet'}
              </Typography>
              {profile.resume_file && (
                <Button
                  variant="text"
                  size="small"
                  onClick={handleResumePreview}
                  disabled={resumePreviewLoading}
                >
                  {resumePreviewLoading ? 'Loading…' : 'View Resume'}
                </Button>
              )}
              {resumeStatus === 'uploading' && <Typography variant="caption">Uploading…</Typography>}
              {resumeStatus === 'done' && <Typography variant="caption" color="success.main">Uploaded</Typography>}
              {resumeStatus === 'error' && <Typography variant="caption" color="error.main">Upload failed</Typography>}
            </>
          )}
        </Stack>
        <Divider />
        <Button variant="contained" onClick={handleSubmit} disabled={profileStatus === 'loading'}>
          Submit profile for review
        </Button>
        {statusMessage && <Typography variant="body2" color="text.secondary">{statusMessage}</Typography>}
      </Stack>
    </Paper>
  );
};

export default ProfileOnboarding;
