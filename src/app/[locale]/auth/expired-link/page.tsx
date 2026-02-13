'use client'
import React from 'react';
import { Box, Button, Typography, Container, Paper } from '@mui/material';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';

const Page = () => {
  const navigate = useRouter();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.100', // Light grey background
        p: 2,
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            borderRadius: 3,
            bgcolor: 'background.paper',
          }}
        >
          {/* Icon Circle */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'error.light', // Light red background
              color: 'error.main',    // Red icon
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
              opacity: 0.2, // Makes the background subtle
              position: 'relative' // To stack the real icon on top
            }}
          >
             {/* We render a duplicate box on top with full opacity for the icon 
                 OR just simplify: */}
          </Box>
           
           {/* Actual Icon (positioned absolutely or just redo the styling above for cleaner code) */}
           {/* Let's do the cleaner styling approach: */}
            <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: '#FEE2E2', // Very light red (Tailwind red-100 equivalent)
              color: '#DC2626',   // Dark red
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <LinkOffIcon sx={{ fontSize: 40 }} />
          </Box>

          {/* Text Content */}
          <Typography variant="h5" fontWeight="bold" gutterBottom color="text.primary">
            Link Expired
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            The link you are trying to access is no longer valid. It may have expired or was already used.
          </Typography>

          {/* Action Buttons */}
          <Button
            variant="contained"
            fullWidth
            size="large"
            disableElevation
            onClick={() => navigate.push('/auth/signin')}
            sx={{ 
                mb: 2, 
                borderRadius: 2, 
                textTransform: 'none',
                fontWeight: 600
            }}
          >
            Go to Login
          </Button>

          <Button
            variant="text"
            fullWidth
            startIcon={<ArrowBackIcon />}
            // onClick={() => navigate(-1)}
            sx={{ 
                color: 'text.secondary',
                textTransform: 'none',
                ':hover': { bgcolor: 'transparent', color: 'text.primary' }
            }}
          >
            Go Back
          </Button>

        </Paper>
        
        {/* Footer / Copyright (Optional) */}
        <Typography variant="caption" display="block" align="center" color="text.disabled" sx={{ mt: 4 }}>
          &copy; {new Date().getFullYear()} School System
        </Typography>

      </Container>
    </Box>
  );
};

export default Page;