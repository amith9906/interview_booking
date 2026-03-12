import {
  Button,
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { downloadResume, fetchResumes } from '../../store/resumeSlice';

const ResumePreviewList = () => {
  const dispatch = useDispatch();
  const resumes = useSelector((state) => state.resume.list);
  const status = useSelector((state) => state.resume.status);
  const initialFilters = useMemo(
    () => ({
      name: '',
      skills: [],
      minRating: '',
      maxRating: '',
      minExperience: '',
      maxExperience: '',
      location: ''
    }),
    []
  );
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState({});

  const availableSkills = useMemo(() => {
    const skillSet = new Set();
    resumes.forEach((resume) => {
      (resume.skills || []).forEach((skill) => {
        if (skill) skillSet.add(skill);
      });
    });
    return [...skillSet].sort();
  }, [resumes]);

  const uniqueLocations = useMemo(() => {
    const locationSet = new Set();
    resumes.forEach((resume) => {
      const loc = resume.location;
      if (loc) locationSet.add(loc);
    });
    return [...locationSet].sort();
  }, [resumes]);

  useEffect(() => {
    dispatch(fetchResumes(appliedFilters));
  }, [dispatch, appliedFilters]);

  const handleDownload = async (id) => {
    try {
      await dispatch(downloadResume(id)).unwrap();
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const handleInputChange = (field) => (event) => {
    setFilters((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
    setAppliedFilters({});
  };

  const formatRatingValue = (value) => {
    if (value === null || value === undefined || value === '') return '—';
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric.toFixed(1) : value;
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" mb={2}>
        Resumes (Preview)
      </Typography>
      <Stack spacing={2} mb={2}>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <TextField label="Name" size="small" value={filters.name} onChange={handleInputChange('name')} />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel shrink>Skills</InputLabel>
            <Select
              multiple
              value={filters.skills}
              onChange={handleInputChange('skills')}
              renderValue={(selected) => (selected.length ? selected.join(', ') : 'All skills')}
            >
              {availableSkills.map((skill) => (
                <MenuItem key={skill} value={skill}>
                  <Checkbox checked={filters.skills.indexOf(skill) > -1} />
                  <ListItemText primary={skill} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel shrink>Location</InputLabel>
            <Select
              label="Location"
              value={filters.location}
              onChange={handleInputChange('location')}
              displayEmpty
            >
              <MenuItem value="">All locations</MenuItem>
              {uniqueLocations.map((loc) => (
                <MenuItem key={loc} value={loc}>
                  {loc}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <TextField
            label="Min rating"
            type="number"
            size="small"
            value={filters.minRating}
            onChange={handleInputChange('minRating')}
          />
          <TextField
            label="Max rating"
            type="number"
            size="small"
            value={filters.maxRating}
            onChange={handleInputChange('maxRating')}
          />
          <TextField
            label="Min experience (yrs)"
            type="number"
            size="small"
            value={filters.minExperience}
            onChange={handleInputChange('minExperience')}
          />
          <TextField
            label="Max experience (yrs)"
            type="number"
            size="small"
            value={filters.maxExperience}
            onChange={handleInputChange('maxExperience')}
          />
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            size="small"
            onClick={handleApplyFilters}
            sx={{ borderRadius: '999px', px: 3, textTransform: 'none' }}
          >
            Apply filters
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={handleResetFilters}
            sx={{ borderRadius: '999px', px: 3, textTransform: 'none' }}
          >
            Reset filters
          </Button>
        </Stack>
      </Stack>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Skills</TableCell>
              <TableCell>Rating</TableCell>
              <TableCell>Experience</TableCell>
              <TableCell>Location</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {status === 'loading' && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography variant="body2" color="text.secondary">
                    Loading resumes…
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {!resumes.length && status === 'succeeded' && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography variant="body2" color="text.secondary">
                    No resumes to preview. Subscribe to unlock downloads.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {resumes.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name || 'Candidate'}</TableCell>
                <TableCell>{(item.skills || []).join(', ') || '—'}</TableCell>
                <TableCell>{formatRatingValue(item.rating)}</TableCell>
                <TableCell>{item.experience_years ?? '—'}</TableCell>
                <TableCell>{item.location || '—'}</TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => handleDownload(item.id)}>
                    Download
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default ResumePreviewList;
