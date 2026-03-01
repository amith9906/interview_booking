import { useForm } from 'react-hook-form';
import { Box, Button, Chip, Grid, Paper, Stack, TextField, Typography } from '@mui/material';

const RegisterForm = () => {
  const { handleSubmit, register } = useForm();

  const onSubmit = (data) => {
    console.log('student register', data);
  };

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h6" mb={2}>
        Student Registration
      </Typography>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField label="Name" fullWidth {...register('name')} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField label="Experience Years" fullWidth {...register('experience_years')} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Education" fullWidth multiline rows={2} {...register('education')} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Projects" fullWidth multiline rows={2} {...register('projects')} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Skills" fullWidth placeholder="React, Node.js, SQL" {...register('skills')} />
          </Grid>
          <Grid item xs={12}>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {[ 'React', 'Node.js', 'PostgreSQL' ].map((skill) => (
                <Chip key={skill} label={skill} />
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained">
              Save Profile
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default RegisterForm;
