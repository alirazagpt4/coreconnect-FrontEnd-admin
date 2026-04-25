import React from 'react';
import { Box, Typography, Paper, Chip, Divider } from '@mui/material';
import { ErrorOutline as ExpiryIcon } from '@mui/icons-material';
import { useSidebar } from '../context/SideBarContext';

const ExpiredStockPerformance = ({ responseData }) => {
     const { open } = useSidebar();
        const expiryWidth = open ? 490 : 570;

    const brandColors = {
        'AMRIJ': '#a855f7',
        'RHD': '#ec4899',
        'RIVAJ': '#f59e0b',
        'NO!MO!': '#10b981',
        'EVERNOYA': '#3b82f6'
    };

    const data = responseData?.data || [];
    const summary = responseData?.summary || {};

    return (
        <Paper elevation={0} sx={{
            p: 2, borderRadius: '16px', border: '1px solid #eef2f6',
            bgcolor: '#fff', height: '470px', width: `${expiryWidth}px`, display: 'flex', flexDirection: 'column'
        }}>
            {/* Header: Synchronized with ShortItems */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{
                        p: 0.6, borderRadius: '8px', bgcolor: '#fff5f5', color: '#f44336',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <ExpiryIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography sx={{ fontWeight: 800, color: '#1a203e', fontSize: '0.75rem' }}>
                            Expired Stock
                        </Typography>
                        <Typography sx={{ color: '#90a4ae', fontSize: '0.6rem', fontWeight: 700, mt: 0.2, display: 'block' }}>
                            Reported by supervisors
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ textAlign: 'right' }}>
                    <Chip
                        label={`${summary.totalUnits || 0} units`}
                        size="small"
                        sx={{ bgcolor: '#ffebee', color: '#d32f2f', fontWeight: 800, borderRadius: '4px', height: '18px', fontSize: '0.6rem' }}
                    />
                    <Typography sx={{ color: '#90a4ae', fontSize: '0.6rem', fontWeight: 700, mt: 0.2, display: 'block' }}>
                        Alerts: {summary.totalReports || 0}
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ mb: 1.5, opacity: 0.3 }} />

            {/* List Section: Synchronized Density */}
            <Box sx={{
                flexGrow: 1, overflowY: 'auto', pr: 0.5,
                '&::-webkit-scrollbar': { width: '3px' },
                '&::-webkit-scrollbar-thumb': { bgcolor: '#f1f1f1', borderRadius: '10px' }
            }}>
                {data.map((item, index) => {
                    const brandColor = brandColors[item.category_name?.toUpperCase()] || '#64748b';

                    return (
                        <Box key={index} sx={{
                            display: 'flex', alignItems: 'center', mb: 0.8, p: 1,
                            bgcolor: '#fff9fb', borderRadius: '8px', border: '1px solid #fff0f3'
                        }}>
                            {/* Quantity Badge - Matched size to ShortItems count */}
                            <Box sx={{
                                minWidth: '28px', height: '28px', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                bgcolor: '#ffebee', color: '#c62828',
                                fontWeight: 900, fontSize: '0.8rem', borderRadius: '6px', mr: 1.2
                            }}>
                                {item.quantity}
                            </Box>

                            {/* Product Info */}
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 700, color: '#1a203e', fontSize: '0.75rem', noWrap: true, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {item.itemInfo?.product_name}
                                </Typography>
                                <Typography sx={{ color: '#78909c', fontSize: '0.65rem', fontWeight: 600 }}>
                                    {item.supervisor_name} • {item.store_name} • {item.area}
                                </Typography>
                                <Typography sx={{ color: '#ef5350', fontSize: '0.6rem', fontWeight: 700, mt: 0.1 }}>
                                    Exp: {item.expiry_date}
                                </Typography>
                            </Box>

                            {/* Brand Chip - Ultra Compact */}
                            <Box sx={{ textAlign: 'right', ml: 1 }}>
                                <Chip
                                    label={item.category_name}
                                    size="small"
                                    sx={{
                                        fontWeight: 800, fontSize: '0.5rem',
                                        bgcolor: brandColor, color: '#fff',
                                        height: '16px', px: 0, borderRadius: '3px', mb: 0.3
                                    }}
                                />
                                <Typography sx={{ color: '#b0bec5', fontSize: '0.55rem', fontWeight: 700, display: 'block' }}>
                                    {item.itemInfo?.item_code?.substring(0, 8)}
                                </Typography>
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Paper>
    );
};

export default ExpiredStockPerformance;