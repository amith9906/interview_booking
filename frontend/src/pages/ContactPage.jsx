import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function ContactPage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 7 } }}>
      <Paper className="hp-pageCard" elevation={0}>
        <Stack spacing={2}>
          <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: -0.8 }}>
            Contact
          </Typography>
          <Typography color="text.secondary">
            Placeholder section for future scalability. Add a contact form, email, WhatsApp, and recruiter enquiry flow
            here.
          </Typography>
          <Box>
            <Button
              variant="contained"
              onClick={() => navigate('/')}
              sx={{
                background: 'linear-gradient(135deg, #ff2d2d 0%, #ff6b6b 100%)',
                boxShadow: '0 10px 30px rgba(255, 0, 0, 0.2)',
                transition: 'all 0.25s ease',
                '&:hover': { boxShadow: '0 14px 40px rgba(255, 0, 0, 0.28)', transform: 'translateY(-1px)' }
              }}
            >
              Back to Home
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}

