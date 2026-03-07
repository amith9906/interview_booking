import { useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, Stack, TextField, Typography, MenuItem, InputLabel, FormControl, Select } from '@mui/material';
import { useForm } from 'react-hook-form';
import api from '../../utils/api';
import { useDispatch, useSelector } from 'react-redux';
import { searchInterviewers } from '../../store/bookingSlice';

const InterviewSearch = () => {
  const dispatch = useDispatch();
  const status = useSelector((state) => state.booking.searchStatus);
  const { handleSubmit, register, watch, setValue } = useForm({
    defaultValues: {
      company: '',
      skills: '',
      experience: '1'
    }
  });
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);

  useEffect(() => {
    const fetchCompanies = async () => {
      setCompaniesLoading(true);
      try {
        const response = await api.get('/student/companies');
        setCompanies(response.data.companies || []);
      } catch (err) {
        console.error('Unable to load companies', err);
      } finally {
        setCompaniesLoading(false);
      }
    };
    fetchCompanies();
  }, []);
  
  const onSubmit = (values) => {
    dispatch(
      searchInterviewers({
        skills: values.skills,
        exp: values.experience,
        company: values.company
      })
    );
  };

  return (
    <Card sx={{ mb: 4, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" mb={1} fontWeight="bold">
          Find an Interviewer
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={4}>
          Search by company to see a list of associated interviewers and their available time slots.
        </Typography>

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3}>
            {/* Primary Search Field */}
            <FormControl fullWidth>
              <InputLabel>Company</InputLabel>
              <TextField
                select
                label="Company"
                variant="outlined"
                size="large"
                value={watch('company')}
                onChange={(event) => setValue('company', event.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(0,0,0,0.2)' } }}
              >
                <MenuItem value="">
                  <em>Any company</em>
                </MenuItem>
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.name}>
                    {company.name}
                  </MenuItem>
                ))}
              </TextField>
            </FormControl>
            
            {/* Secondary Advanced Filters */}
            <Box display="flex" gap={2} flexWrap="wrap">
              <TextField 
                label="Required Skills (Mandatory)" 
                placeholder="React, Node.js, System Design"
                required
                error={!watch('skills') && status === 'idle'}
                helperText={!watch('skills') ? 'Skills are required for matching' : ''}
                sx={{ flex: 2, minWidth: 200 }}
                {...register('skills', { required: true })} 
              />
              <FormControl sx={{ flex: 1, minWidth: 150 }}>
                <InputLabel>Min Experience</InputLabel>
                <Select label="Min Experience" defaultValue="1" {...register('experience')}>
                  <MenuItem value="0">Any / Fresher</MenuItem>
                  <MenuItem value="1">1+ year</MenuItem>
                  <MenuItem value="2">2+ years</MenuItem>
                  <MenuItem value="3">3+ years</MenuItem>
                  <MenuItem value="5">5+ years</MenuItem>
                  <MenuItem value="10">10+ years</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Button 
              variant="contained" 
              type="submit" 
              size="large" 
              sx={{ mt: 2, py: 1.5, background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' }}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Searching...' : 'Search Interviewers'}
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};

export default InterviewSearch;
