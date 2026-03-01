import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import api from '../../utils/api';
import EditIcon from '@mui/icons-material/Edit';

const AdminCatalogManager = () => {
  const [companies, setCompanies] = useState([]);
  const [skills, setSkills] = useState([]);
  const [companyEdits, setCompanyEdits] = useState({});
  const [skillEdits, setSkillEdits] = useState({});
  const [newCompany, setNewCompany] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [status, setStatus] = useState('');

  const load = async () => {
    const [companiesRes, skillsRes] = await Promise.all([
      api.get('/admin/companies'),
      api.get('/admin/skills')
    ]);
    setCompanies(companiesRes.data);
    setSkills(skillsRes.data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCompanyChange = (id, field, value) => {
    setCompanyEdits((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const handleSkillChange = (id, field, value) => {
    setSkillEdits((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const saveCompany = async (id) => {
    const payload = companyEdits[id];
    if (!payload) return;
    await api.put(`/admin/companies/${id}`, payload);
    setCompanyEdits((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setStatus('Company saved');
    load();
  };

  const saveSkill = async (id) => {
    const payload = skillEdits[id];
    if (!payload) return;
    await api.put(`/admin/skills/${id}`, payload);
    setSkillEdits((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setStatus('Skill saved');
    load();
  };

  const togglePublish = async (type, id) => {
    await api.patch(`/admin/${type}/${id}/publish`);
    setStatus('Publish status toggled');
    load();
  };

  const handleCreateCompany = async () => {
    if (!newCompany.trim()) return;
    await api.post('/admin/companies', { name: newCompany.trim(), published: false });
    setNewCompany('');
    setStatus('Company added');
    load();
  };

  const handleCreateSkill = async () => {
    if (!newSkill.trim()) return;
    await api.post('/admin/skills', { name: newSkill.trim(), published: false });
    setNewSkill('');
    setStatus('Skill added');
    load();
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6">Catalog Builder</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Add/edit companies and skills, then publish them when ready so students can see the updated catalog.
      </Typography>
      {status && (
        <Alert severity="info" onClose={() => setStatus('')} sx={{ mb: 2 }}>
          {status}
        </Alert>
      )}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1">Create Company</Typography>
              <Stack direction="row" spacing={1} mt={2}>
                <TextField
                  placeholder="Company name"
                  value={newCompany}
                  onChange={(event) => setNewCompany(event.target.value)}
                  fullWidth
                />
                <Button variant="contained" onClick={handleCreateCompany}>
                  Add
                </Button>
              </Stack>
            </CardContent>
          </Card>
          {companies.map((company) => {
            const edit = companyEdits[company.id] || {};
            return (
              <Card key={company.id} variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                    <Typography variant="subtitle2">Company #{company.id}</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        Published
                      </Typography>
                      <Switch
                        size="small"
                        checked={company.published}
                        onChange={() => togglePublish('companies', company.id)}
                      />
                    </Stack>
                  </Stack>
                  <TextField
                    fullWidth
                    label="Name"
                    value={edit.name ?? company.name}
                    onChange={(event) => handleCompanyChange(company.id, 'name', event.target.value)}
                    sx={{ mt: 1 }}
                  />
                  <Button size="small" startIcon={<EditIcon />} sx={{ mt: 1 }} onClick={() => saveCompany(company.id)}>
                    Save
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </Grid>
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1">Create Skill</Typography>
              <Stack direction="row" spacing={1} mt={2}>
                <TextField
                  placeholder="Skill name"
                  value={newSkill}
                  onChange={(event) => setNewSkill(event.target.value)}
                  fullWidth
                />
                <Button variant="contained" onClick={handleCreateSkill}>
                  Add
                </Button>
              </Stack>
            </CardContent>
          </Card>
          {skills.map((skill) => {
            const edit = skillEdits[skill.id] || {};
            return (
              <Card key={skill.id} variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                    <Typography variant="subtitle2">Skill #{skill.id}</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        Published
                      </Typography>
                      <Switch
                        size="small"
                        checked={skill.published}
                        onChange={() => togglePublish('skills', skill.id)}
                      />
                    </Stack>
                  </Stack>
                  <TextField
                    fullWidth
                    label="Name"
                    value={edit.name ?? skill.name}
                    onChange={(event) => handleSkillChange(skill.id, 'name', event.target.value)}
                    sx={{ mt: 1 }}
                  />
                  <Button size="small" startIcon={<EditIcon />} sx={{ mt: 1 }} onClick={() => saveSkill(skill.id)}>
                    Save
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </Grid>
      </Grid>
    </Paper>
  );
};

export default AdminCatalogManager;
