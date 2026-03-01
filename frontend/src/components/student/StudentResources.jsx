import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Link,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import api from '../../utils/api';

const resourceLabel = {
  pdf: 'PDF',
  ppt: 'Presentation',
  link: 'Link',
  video: 'Video',
  other: 'Resource'
};

const StudentResources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadResources = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/student/resources');
      setResources(response.data.resources || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      {!resources.length && !loading && (
        <Typography variant="body2" color="text.secondary">
          No resources shared yet.
        </Typography>
      )}
      {resources.map((resource) => (
        <Paper
          key={resource.id}
          variant="outlined"
          sx={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)', p: 2 }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Box>
              <Typography variant="subtitle1">{resource.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {resource.description}
              </Typography>
              <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                <Chip label={resourceLabel[resource.resource_type] || 'Resource'} size="small" />
                <Chip label={`Shared by ${resource.creator || 'Admin'}`} size="small" variant="outlined" />
                <Chip label={`Assigned on ${new Date(resource.assigned_at).toLocaleDateString()}`} size="small" variant="outlined" />
              </Stack>
            </Box>
            <Stack direction="row" spacing={1}>
              {resource.file_url && (
                <Button variant="outlined" component="a" href={resource.file_url} target="_blank" rel="noreferrer">
                  Download
                </Button>
              )}
              {resource.link && (
                <Button variant="contained" component="a" href={resource.link} target="_blank" rel="noreferrer">
                  Open link
                </Button>
              )}
              {!resource.file_url && !resource.link && (
                <Typography variant="caption" color="text.secondary">
                  No asset attached
                </Typography>
              )}
            </Stack>
          </Stack>
        </Paper>
      ))}
      {loading && (
        <Typography variant="body2" color="text.secondary">
          Loading resources…
        </Typography>
      )}
    </Stack>
  );
};

export default StudentResources;
