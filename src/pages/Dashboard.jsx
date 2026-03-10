import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import { Dashboard as DashboardIcon, HourglassEmpty, Engineering } from '@mui/icons-material';

const Dashboard = () => {
    return (
        <Box sx={{ p: 3, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
            {/* Header section matching your style */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <DashboardIcon sx={{ mr: 1, color: '#ab1d47', fontSize: 28 }} />
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1b2142' }}>
                    Dashboard
                </Typography>
            </Box>

            {/* Main Content Area */}
            <Paper
                sx={{
                    p: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 3,
                    boxShadow: '0px 4px 20px rgba(0,0,0,0.05)',
                    minHeight: '60vh',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f9f9fb 100%)'
                }}
            >
                {/* Animated/Styled Icon */}
                <Box sx={{ position: 'relative', mb: 4 }}>
                    <Engineering sx={{ fontSize: 100, color: '#e0e0e0' }} />
                    <HourglassEmpty
                        sx={{
                            fontSize: 50,
                            color: '#ab1d47',
                            position: 'absolute',
                            bottom: 0,
                            right: -10,
                            animation: 'spin 3s linear infinite'
                        }}
                    />
                </Box>

                <Typography variant="h3" sx={{ fontWeight: '800', color: '#1b2142', mb: 2, textAlign: 'center' }}>
                    Dashboard is <span style={{ color: '#ab1d47' }}>Coming Soon</span>
                </Typography>

                <Typography variant="body1" sx={{ color: '#666', textAlign: 'center', maxWidth: '500px', fontSize: '1.1rem' }}>
                    We are working on it.
                </Typography>

                {/* CSS for simple animation */}
                <style>
                    {`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}
                </style>
            </Paper>


        </Box>
    );
};

export default Dashboard;