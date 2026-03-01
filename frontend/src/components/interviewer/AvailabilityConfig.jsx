import { Box, Button, Card, CardContent, Chip, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../../store/authSlice';

const AvailabilityConfig = () => {
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.auth.profile);
  const profileStatus = useSelector((state) => state.auth.profileStatus);
  const [slots, setSlots] = useState(profile?.availability_slots || []);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const handleAddSlot = () => {
    if (!selectedDate || !selectedTime) return;
    
    setSlots((prev) => {
      const existingDateIndex = prev.findIndex((s) => s.date === selectedDate);
      if (existingDateIndex >= 0) {
        const dateSlot = prev[existingDateIndex];
        if (!dateSlot.time_slots.includes(selectedTime)) {
          const updated = [...prev];
          updated[existingDateIndex] = { ...dateSlot, time_slots: [...dateSlot.time_slots, selectedTime].sort() };
          return updated;
        }
        return prev;
      }
      return [...prev, { date: selectedDate, time_slots: [selectedTime] }].sort((a, b) => a.date.localeCompare(b.date));
    });
    setSelectedTime('');
  };

  const handleRemoveTime = (date, timeToRemove) => {
    setSlots((prev) => {
      return prev
        .map((s) => {
          if (s.date === date) {
            return { ...s, time_slots: s.time_slots.filter((t) => t !== timeToRemove) };
          }
          return s;
        })
        .filter((s) => s.time_slots.length > 0);
    });
  };

  const handleSave = () => {
    dispatch(updateProfile({ availability_slots: slots }));
  };

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Availability Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Configure the dates and times you are available to conduct interviews.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={4} alignItems="flex-start">
          <TextField
            label="Date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="Time"
            type="time"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <Button variant="contained" onClick={handleAddSlot} disabled={!selectedDate || !selectedTime} sx={{ height: 56, px: 4 }}>
            Add
          </Button>
        </Stack>

        <Stack spacing={3} mb={4}>
          {slots.length === 0 ? (
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
              No availability slots configured.
            </Typography>
          ) : (
            slots.map((slot) => (
              <Box key={slot.date} sx={{ p: 2, background: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                <Typography variant="subtitle2" mb={1} fontWeight="bold">
                  {slot.date}
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {slot.time_slots.map((time) => (
                    <Chip
                      key={time}
                      label={time}
                      onDelete={() => handleRemoveTime(slot.date, time)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </Box>
            ))
          )}
        </Stack>

        <Button
          variant="contained"
          color="secondary"
          onClick={handleSave}
          disabled={profileStatus === 'loading'}
          fullWidth
        >
          Save Availability
        </Button>
      </CardContent>
    </Card>
  );
};

export default AvailabilityConfig;
