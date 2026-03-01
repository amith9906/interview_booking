import { Box, Container, Tab, Tabs, Typography } from '@mui/material';
import { useState } from 'react';
import InterviewRatingForm from '../components/interviewer/InterviewRatingForm';
import ScheduleManagement from '../components/interviewer/ScheduleManagement';
import InterviewerAnalytics from '../components/analytics/InterviewerAnalytics';
import ProfileOnboarding from '../components/onboarding/ProfileOnboarding';
import AvailabilityConfig from '../components/interviewer/AvailabilityConfig';
import AccountSettings from '../components/account/AccountSettings';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const InterviewerDashboard = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" mb={3} fontWeight="bold">
        Interviewer Console
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="interviewer dashboard tabs" textColor="primary" indicatorColor="primary" variant="scrollable" scrollButtons="auto">
          <Tab label="Analytics & Profile" />
          <Tab label="Availability" />
          <Tab label="Booked & Rate Interviews" />
          <Tab label="Account" />
        </Tabs>
      </Box>

      <TabPanel value={value} index={0}>
        <InterviewerAnalytics />
        <Box sx={{ mt: 4 }}>
          <ProfileOnboarding role="interviewer" />
        </Box>
      </TabPanel>
      <TabPanel value={value} index={1}>
        <AvailabilityConfig />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <ScheduleManagement />
        <Box sx={{ mt: 4 }}>
          <InterviewRatingForm />
        </Box>
      </TabPanel>
      <TabPanel value={value} index={3}>
        <AccountSettings />
      </TabPanel>
    </Container>
  );
};

export default InterviewerDashboard;
