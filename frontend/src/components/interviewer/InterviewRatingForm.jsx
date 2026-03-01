import { Box, Button, MenuItem, Paper, Select, Stack, TextField, Typography } from '@mui/material';
import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInterviewerBookings, submitInterviewRating } from '../../store/bookingSlice';

const initialSkills = ['React', 'Node.js', 'Communication'];

const InterviewRatingForm = () => {
  const dispatch = useDispatch();
  const { register, handleSubmit, control, reset } = useForm({
    defaultValues: {
      booking_id: '',
      skills: initialSkills.map((skill) => ({ name: skill, rating: '', comment: '' })),
      overall_rating: '',
      feedback: '',
      improve_areas: ''
    }
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'skills' });
  const bookings = useSelector((state) => state.booking.interviewerBookings);

  useEffect(() => {
    dispatch(fetchInterviewerBookings());
  }, [dispatch]);

  const onSubmit = async (data) => {
    const cleanedSkills = (data.skills || [])
      .map((skill) => ({
        name: skill.name?.trim(),
        rating: skill.rating,
        comment: skill.comment
      }))
      .filter((skill) => skill.name);

    const skill_ratings = {};
    const skill_comments = {};
    cleanedSkills.forEach((skill) => {
      skill_ratings[skill.name] = Number(skill.rating) || 0;
      if (skill.comment) {
        skill_comments[skill.name] = skill.comment.trim();
      }
    });

    const payload = {
      booking_id: data.booking_id,
      skill_ratings,
      skill_comments,
      overall_rating: Number(data.overall_rating) || 0,
      feedback: data.feedback,
      improve_areas: data.improve_areas ? data.improve_areas.split(',').map((item) => item.trim()) : []
    };
    dispatch(submitInterviewRating(payload));
    reset();
  };

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" mb={2}>
        Interview Template
      </Typography>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          <Select fullWidth defaultValue="" {...register('booking_id')}>
            <MenuItem value="">Select booking</MenuItem>
            {bookings.map((booking) => (
              <MenuItem key={booking.id} value={booking.id}>
                {booking.slot_time ? new Date(booking.slot_time).toLocaleString() : booking.id}
              </MenuItem>
            ))}
          </Select>
          {fields.map((field, index) => (
            <Stack key={field.id} spacing={1} sx={{ p: 2, border: '1px solid rgba(255,255,255,0.15)', borderRadius: 2 }}>
              <TextField
                label="Skill"
                {...register(`skills.${index}.name`, { required: true })}
                defaultValue={field.name}
                fullWidth
              />
              <TextField
                label="Rating (1-5)"
                type="number"
                inputProps={{ min: 1, max: 5, step: 1 }}
                {...register(`skills.${index}.rating`)}
              />
              <TextField
                label="Comments for this skill"
                {...register(`skills.${index}.comment`)}
                multiline
                rows={2}
              />
              <Button
                variant="text"
                color="secondary"
                onClick={() => {
                  if (fields.length > 1) remove(index);
                }}
                disabled={fields.length === 1}
              >
                Remove skill
              </Button>
            </Stack>
          ))}
          <Button variant="outlined" onClick={() => append({ name: '', rating: '', comment: '' })}>
            Add another skill
          </Button>
          <TextField label="Overall Rating" type="number" inputProps={{ min: 1, max: 5 }} {...register('overall_rating')} />
          <TextField label="Comments / Feedback" multiline rows={3} {...register('feedback')} />
          <TextField label="Improvement Areas (comma separated)" {...register('improve_areas')} />
          <Button variant="contained" type="submit">
            Submit Feedback
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
};

export default InterviewRatingForm;
