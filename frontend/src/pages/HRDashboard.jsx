import { Box, Container, Tab, Tabs, Typography } from '@mui/material';
import { useState } from 'react';
import ResumeMarketplace from '../components/hr/ResumeMarketplace';
import ResumePreviewList from '../components/hr/ResumePreviewList';
import HRAnalytics from '../components/analytics/HRAnalytics';
import AccountSettings from '../components/account/AccountSettings';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const HRDashboard = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Container sx={{ py: 4 }}>
    <Typography variant="h4" mb={3} fontWeight="bold">
      HR / Consultancy Hub
    </Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="hr dashboard tabs" textColor="primary" indicatorColor="primary">
          <Tab label="Analytics" />
          <Tab label="Resume Marketplace" />
          <Tab label="Saved Previews" />
          <Tab label="Account" />
        </Tabs>
      </Box>

      <TabPanel value={value} index={0}>
        <HRAnalytics />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <ResumeMarketplace />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <ResumePreviewList />
      </TabPanel>
      <TabPanel value={value} index={3}>
        <AccountSettings />
      </TabPanel>
    </Container>
  );
};

export default HRDashboard;
