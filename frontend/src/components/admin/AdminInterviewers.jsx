import { Button, Chip, InputLabel, MenuItem, Paper, Select, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import api from '../../utils/api';

const AdminInterviewers = () => {
  const [interviewers, setInterviewers] = useState([]);
  const [skills, setSkills] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [edits, setEdits] = useState({});

  const loadData = async () => {
    const [interviewersRes, companiesRes, skillsRes] = await Promise.all([
      api.get('/admin/interviewers'),
      api.get('/admin/companies'),
      api.get('/admin/skills')
    ]);
    setInterviewers(interviewersRes.data);
    setCompanies(companiesRes.data);
    setSkills(skillsRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (id, field, value) => {
    setEdits((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handleSave = async (id) => {
    const payload = edits[id];
    if (!payload) return;
    let availability;
    if (payload.availability_slots) {
      try {
        availability = JSON.parse(payload.availability_slots);
      } catch {
        availability = payload.availability_slots;
      }
    }
    const baseInterviewer = interviewers.find((item) => item.id === id) || {};
    const formatted = {
      company_id: payload.company_id ?? baseInterviewer.company_id,
      title: payload.title ?? baseInterviewer.title,
      skill_set: payload.skill_set ?? baseInterviewer.skill_set,
      availability_slots: availability ?? baseInterviewer.availability_slots,
      bio: payload.bio ?? baseInterviewer.bio
    };
    await api.put(`/admin/interviewers/${id}`, formatted);
    setEdits((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    loadData();
  };

  const renderAvailability = (source) => {
    let slots = source;
    if (typeof slots === 'string') {
      try {
        slots = JSON.parse(slots);
      } catch {
        slots = [];
      }
    }
    if (!Array.isArray(slots)) return null;
    return (
      <Stack direction="column" spacing={0.5}>
        {slots.map((slot) => (
          <Stack key={slot.date} spacing={1} direction="row" flexWrap="wrap">
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 100 }}>
              {new Date(slot.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' })}
            </Typography>
            {(slot.time_slots || []).map((time) => (
              <Chip key={`${slot.date}-${time}`} label={time} size="small" variant="outlined" />
            ))}
          </Stack>
        ))}
      </Stack>
    );
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" mb={2}>
        Interviewer Roster
      </Typography>
      <Stack spacing={2}>
        {interviewers.map((interviewer) => {
          const current = edits[interviewer.id] || {};
          const availability = current.availability_slots ?? JSON.stringify(interviewer.availability_slots || []);
          return (
            <Stack key={interviewer.id} spacing={1} sx={{ border: '1px solid #eee', p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1">{interviewer.User?.name || 'Interviewer'}</Typography>
              <Select
                fullWidth
                value={current.company_id ?? interviewer.company_id ?? ''}
                onChange={(event) => handleEdit(interviewer.id, 'company_id', event.target.value)}
              >
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {skills.map((skill) => {
                  const effectiveSkillSet = current.skill_set ?? interviewer.skill_set ?? [];
                  const isActive = effectiveSkillSet.includes(skill.name);
                  return (
                    <Chip
                      key={skill.id}
                      label={skill.name}
                      onClick={() => {
                        const skillSet = new Set(effectiveSkillSet);
                        isActive ? skillSet.delete(skill.name) : skillSet.add(skill.name);
                        handleEdit(interviewer.id, 'skill_set', [...skillSet]);
                      }}
                      variant={isActive ? 'filled' : 'outlined'}
                    />
                  );
                })}
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Availability
              </Typography>
              {renderAvailability(current.availability_slots ?? interviewer.availability_slots ?? [])}
              <TextField
                label="Availability (JSON)"
                fullWidth
                multiline
                rows={2}
                value={availability}
                onChange={(event) => handleEdit(interviewer.id, 'availability_slots', event.target.value)}
              />
              <TextField
                label="Bio"
                value={current.bio ?? interviewer.bio ?? ''}
                fullWidth
                onChange={(event) => handleEdit(interviewer.id, 'bio', event.target.value)}
              />
              <Button variant="contained" onClick={() => handleSave(interviewer.id)}>
                Save Interviewer
              </Button>
            </Stack>
          );
        })}
      </Stack>
    </Paper>
  );
};

export default AdminInterviewers;
