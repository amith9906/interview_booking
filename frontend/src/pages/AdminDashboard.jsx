import { Box, Button, Container, Stack, Tab, Tabs, Typography } from '@mui/material';
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard';
import AdminInterviewers from '../components/admin/AdminInterviewers';
import AdminConsultancies from '../components/admin/AdminConsultancies';
import AdminBookings from '../components/admin/AdminBookings';
import AdminCatalogManager from '../components/admin/AdminCatalogManager';
import AdminCourses from '../components/admin/AdminCourses';
import AdminInternships from '../components/admin/AdminInternships';
import AdminResources from '../components/admin/AdminResources';
import AdminCreditsAnalytics from '../components/admin/AdminCreditsAnalytics';
import AdminQuizAnalytics from '../components/admin/AdminQuizAnalytics';
import ProfileVerificationPanel from '../components/admin/ProfileVerificationPanel';
import UserManager from '../components/admin/UserManager';
import AdminQuizManager from '../components/admin/AdminQuizManager';
import AdminHrPipeline from '../components/admin/AdminHrPipeline';
import AdminPaymentsLog from '../components/admin/AdminPaymentsLog';
import AccountSettings from '../components/account/AccountSettings';
import { useState } from 'react';
import api from '../utils/api';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminDashboard = () => {
  const [exporting, setExporting] = useState(false);
  const [feedbackExporting, setFeedbackExporting] = useState(false);
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const downloadCsv = (filename, header, rows) => {
    const escapeCell = (cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`;
    const headerLine = header.map(escapeCell).join(',');
    const body = rows.map((row) => row.map(escapeCell).join(',')).join('\n');
    const csv = `${headerLine}${body ? `\n${body}` : ''}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await api.get('/admin/reports');
      const bookingRows = response.data.bookings.map((booking) => [
        booking.id,
        booking.student,
        booking.interviewer,
        booking.company,
        booking.slot_time,
        booking.amount,
        booking.status
      ]);
      downloadCsv('booking-report.csv', ['Booking ID', 'Student', 'Interviewer', 'Company', 'Slot', 'Amount', 'Status'], bookingRows);

      const profiles = response.data.profiles || {};
      const profileRows = [];
      (profiles.students || []).forEach((student) => {
        profileRows.push([
          'Student',
          student.name,
          student.email,
          student.profile_status,
          student.is_active ? 'Active' : 'Paused',
          student.resume_file || '—',
          `Skills: ${student.skills?.join(', ') || '—'}; Hobbies: ${student.hobbies?.join(', ') || '—'}`
        ]);
      });
      (profiles.interviewers || []).forEach((interviewer) => {
        profileRows.push([
          'Interviewer',
          interviewer.name,
          interviewer.email,
          interviewer.profile_status,
          interviewer.is_active ? 'Active' : 'Paused',
          interviewer.company || '—',
          `Skills: ${interviewer.skill_set?.join(', ') || '—'}`
        ]);
      });
      downloadCsv(
        'profile-status-report.csv',
        ['Role', 'Name', 'Email', 'Status', 'Active', 'Primary Document', 'Highlights'],
        profileRows
      );

      const skillByCompany = response.data.skillByCompany || {};
      const skillRows = [];
      Object.entries(skillByCompany).forEach(([company, skills]) => {
        Object.entries(skills).forEach(([skill, count]) => {
          skillRows.push([company, skill, count]);
        });
      });
      if (skillRows.length) {
        downloadCsv('skill-company-report.csv', ['Company', 'Skill', 'Mentions'], skillRows);
      }

      const consultancies = response.data.consultancies || [];
      const consultancyRows = [];
      consultancies.forEach((consultancy) => {
        const transactions = consultancy.transactions || [];
        if (transactions.length) {
          transactions.forEach((tx) => {
            consultancyRows.push([
              consultancy.name,
              consultancy.email,
              consultancy.credits,
              consultancy.downloads,
              consultancy.uniqueResumes,
              tx.type,
              tx.credits,
              tx.description,
              tx.resume?.student || '',
              tx.created_at
            ]);
          });
        } else {
          consultancyRows.push([
            consultancy.name,
            consultancy.email,
            consultancy.credits,
            consultancy.downloads,
            consultancy.uniqueResumes,
            '—',
            '—',
            '—',
            '—',
            '—'
          ]);
        }
      });
      if (consultancyRows.length) {
        downloadCsv(
          'consultancy-credits-report.csv',
          ['Consultancy', 'Email', 'Credits Available', 'Downloads', 'Unique Resumes', 'Txn Type', 'Credits', 'Notes', 'Resume', 'Date'],
          consultancyRows
        );
      }
    } finally {
      setExporting(false);
    }
  };

  const handleFeedbackExport = async () => {
    try {
      setFeedbackExporting(true);
      const response = await api.get('/admin/feedback/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'feedback-history.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Feedback export failed', error);
    } finally {
      setFeedbackExporting(false);
    }
  };

  return (
    <Container sx={{ py: 4 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Typography variant="h4" fontWeight="bold">
        Admin Console
      </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Export Reports & Profiles'}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleFeedbackExport}
            disabled={feedbackExporting}
          >
            {feedbackExporting ? 'Exporting feedback…' : 'Export feedback history'}
          </Button>
        </Stack>
    </Box>

    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="admin dashboard tabs"
          textColor="primary"
          indicatorColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <Tab label="Analytics" />
          <Tab label="Verification" />
          <Tab label="Interviewers" />
          <Tab label="Consultancies" />
          <Tab label="Bookings" />
          <Tab label="Payments" />
          <Tab label="Credits" />
          <Tab label="Quiz KPIs" />
          <Tab label="Resources" />
          <Tab label="Courses" />
          <Tab label="Internships" />
          <Tab label="Catalog" />
          <Tab label="Quizzes" />
          <Tab label="HR Pipeline" />
          <Tab label="Users" />
          <Tab label="Account" />
        </Tabs>
      </Box>

      <TabPanel value={value} index={0}>
        <AnalyticsDashboard />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <ProfileVerificationPanel />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <AdminInterviewers />
      </TabPanel>
      <TabPanel value={value} index={3}>
        <AdminConsultancies />
      </TabPanel>
      <TabPanel value={value} index={4}>
        <AdminBookings />
      </TabPanel>
      <TabPanel value={value} index={5}>
        <AdminPaymentsLog />
      </TabPanel>
      <TabPanel value={value} index={6}>
        <AdminCreditsAnalytics />
      </TabPanel>
      <TabPanel value={value} index={7}>
        <AdminQuizAnalytics />
      </TabPanel>
      <TabPanel value={value} index={8}>
        <AdminResources />
      </TabPanel>
      <TabPanel value={value} index={9}>
        <AdminCourses />
      </TabPanel>
      <TabPanel value={value} index={10}>
        <AdminInternships />
      </TabPanel>
      <TabPanel value={value} index={11}>
        <AdminCatalogManager />
      </TabPanel>
      <TabPanel value={value} index={12}>
        <AdminQuizManager />
      </TabPanel>
      <TabPanel value={value} index={13}>
        <AdminHrPipeline />
      </TabPanel>
      <TabPanel value={value} index={14}>
        <UserManager />
      </TabPanel>
      <TabPanel value={value} index={15}>
        <AccountSettings />
      </TabPanel>
    </Container>
  );
};

export default AdminDashboard;
