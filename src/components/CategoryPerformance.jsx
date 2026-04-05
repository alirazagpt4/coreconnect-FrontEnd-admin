import React from 'react';
import {
    Box,
    Card,
    Typography,
    LinearProgress,
    Avatar,
    Stack,
    Chip
} from '@mui/material';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';

import { formatCompactNumber } from '../utils/formatter.js';

const CategoryPerformance = ({ responseData }) => {
    const { summary, data } = responseData;

    const brandColors = {
        'RIVAJ': '#A020F0',
        'AMRIJ': '#FF1493',
        'RHD': '#FFA500',
        'NO!MO!': '#00C49F',
        'EVERNOYA': '#0088FE',
    };

  

    return (
        <Card sx={{
            borderRadius: 4,
            p: 2.5, // Thora sa padding kam kiya balance ke liye
            boxShadow: '0px 4px 20px rgba(0,0,0,0.05)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header Area - Chota Font & Icon */}
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                <Avatar sx={{ bgcolor: '#F3E5F5', color: '#A020F0', borderRadius: 2, width: 34, height: 34 }}>
                    <ShoppingBagOutlinedIcon sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.1, color: '#1a203e' }}>
                        Category Performance
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Brand-wise breakdown
                    </Typography>
                </Box>
            </Stack>

            {/* Summary Box - Font sizes scaled down */}
            <Box sx={{
                bgcolor: '#F9F5FF',
                borderRadius: 3,
                p: 2,
                textAlign: 'center',
                mb: 3
            }}>
                <Typography sx={{ fontWeight: 900, color: '#7B1FA2', fontSize: '1.4rem' }}>
                    {formatCompactNumber(summary.totalRevenue)}
                </Typography>
                <Typography sx={{ fontWeight: 700, color: '#9C27B0', fontSize: '0.9rem', mt: -0.5 }}>
                    {summary.totalUnits} units
                </Typography>
                <Typography variant="caption" sx={{ color: '#90a4ae', fontWeight: 300, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Total Sales & Quantity
                </Typography>
            </Box>

            {/* Brand Progress List - Compact spacing */}
            <Stack spacing={2}>
                {data.map((brand, index) => (
                    <Box key={index}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
                            {/* Brand Name - Smaller bold font */}
                            <Typography sx={{ fontWeight: 700, color: '#333', fontSize: '0.8rem' }}>
                                {brand.name}
                            </Typography>

                            <Stack direction="row" spacing={1} alignItems="center">
                                <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#666' }}>
                                    {brand.units}
                                </Typography>
                                <Chip
                                    label={`${brand.percentage}%`}
                                    sx={{
                                        height: 18,
                                        fontSize: '0.65rem',
                                        fontWeight: 800,
                                        bgcolor: (brandColors[brand.name] || '#7B1FA2') + '15',
                                        color: brandColors[brand.name] || '#7B1FA2',
                                        border: `1px solid ${(brandColors[brand.name] || '#7B1FA2')}30`
                                    }}
                                />
                            </Stack>
                        </Stack>

                        <LinearProgress
                            variant="determinate"
                            value={parseFloat(brand.percentage)}
                            sx={{
                                height: 6, // Slimmer bars
                                borderRadius: 5,
                                bgcolor: '#F0F0F0',
                                '& .MuiLinearProgress-bar': {
                                    bgcolor: brandColors[brand.name] || '#7B1FA2',
                                    borderRadius: 5
                                }
                            }}
                        />
                    </Box>
                ))}
            </Stack>
        </Card>
    );
};

export default CategoryPerformance;