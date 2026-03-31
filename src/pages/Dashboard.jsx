import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Button, 
    CircularProgress, Stack, Divider, TextField, Tooltip, IconButton
} from '@mui/material';
import {
    AdsClick as TargetIcon, 
    TrendingUp, Groups, Storefront, BarChart, RestartAlt
} from '@mui/icons-material';
import moment from 'moment';
import API from '../api/API';

const Dashboard = () => {
    // Defining initial dates here so handleReset can access them
    const initialCustomDates = {
        start: moment().startOf('month').format('YYYY-MM-DD'),
        end: moment().format('YYYY-MM-DD')
    };

    const [range, setRange] = useState('this_month');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [customDates, setCustomDates] = useState(initialCustomDates);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            let url = `/dashboard/stats?range=${range}`;
            if (range === 'custom') {
                url += `&startDate=${customDates.start}&endDate=${customDates.end}`;
            }
            const res = await API.get(url);
            setStats(res.data.data);
        } catch (err) {
            console.error("Dashboard Error:", err);
        } finally {
            setLoading(false);
        }
    }, [range, customDates]);

    useEffect(() => {
        if (range !== 'custom') fetchStats();
    }, [range, fetchStats]);

    const handleReset = () => {
        setRange('this_week'); 
        setCustomDates(initialCustomDates);
    };

    return (
        <Box sx={{ p: 3, bgcolor: '#f4f7f9', minHeight: '100vh' }}>
            
            {/* UPDATED HEADER SECTION */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#1a203e', letterSpacing: '-0.5px' }}>
                        Sales Command Center
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666', fontWeight: 600 }}>
                        {moment().format('dddd, MMMM DD, YYYY')}
                    </Typography>
                </Box>

                {/* FILTERS AND RESET GROUPED ON THE RIGHT */}
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Paper elevation={0} sx={{ p: 0.5, borderRadius: '12px', border: '1px solid #e0e6ed', bgcolor: '#fff' }}>
                        <Stack direction="row" spacing={0.5}>
                            {['yesterday', 'this_week', 'this_month', 'custom'].map((r) => (
                                <Button
                                    key={r}
                                    size="small"
                                    variant={range === r ? 'contained' : 'text'}
                                    onClick={() => setRange(r)}
                                    sx={{
                                        borderRadius: '10px', px: 2, fontSize: '0.75rem', fontWeight: 700,
                                        textTransform: 'capitalize',
                                        bgcolor: range === r ? '#1a203e' : 'transparent',
                                        color: range === r ? '#fff' : '#666',
                                        '&:hover': { bgcolor: range === r ? '#2a335a' : '#f5f5f5' }
                                    }}
                                >
                                    {r.replace('_', ' ')}
                                </Button>
                            ))}
                        </Stack>
                    </Paper>

                    <Tooltip title="Reset to Weekly">
                        <IconButton 
                            onClick={handleReset}
                            sx={{ 
                                bgcolor: '#fff', 
                                border: '1px solid #e0e6ed',
                                borderRadius: '12px',
                                width: 40,
                                height: 40,
                                '&:hover': { bgcolor: '#f5f5f5', color: '#ab1d47' }
                            }}
                        >
                            <RestartAlt fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Stack>

            {/* CUSTOM FILTER BAR */}
            {range === 'custom' && (
                <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: '12px', border: '1px solid #ab1d4720', bgcolor: '#fff' }}>
                    <Stack direction="row" spacing={2} justifyContent="flex-end" alignItems="center">
                        <TextField type="date" label="Start" size="small" InputLabelProps={{ shrink: true }}
                            value={customDates.start} onChange={(e) => setCustomDates({ ...customDates, start: e.target.value })} />
                        <TextField type="date" label="End" size="small" InputLabelProps={{ shrink: true }}
                            value={customDates.end} onChange={(e) => setCustomDates({ ...customDates, end: e.target.value })} />
                        <Button variant="contained" size="small" onClick={fetchStats} sx={{ bgcolor: '#ab1d47', fontWeight: 700, px: 3 }}>Apply</Button>
                    </Stack>
                </Paper>
            )}

            {/* KPI ROW */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: '#ab1d47' }} /></Box>
            ) : (
                <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    width: '100%',
                    flexWrap: 'nowrap',
                    overflowX: 'auto',
                    pb: 1
                }}>
                    <StatCard title="Total Revenue" value={`Rs ${Math.round(stats?.totalRevenue || 0).toLocaleString()}`} 
                        subtitle="Overall Earnings" icon={<BarChart />} color="#673ab7" />
                    
                    <StatCard title="Items Sold" value={stats?.itemsSold || '0'} 
                        subtitle="Total Units" icon={<TrendingUp />} color="#ab1d47" />
                    
                    <StatCard title="Conversion" value={stats?.conversions || '0%'} 
                        subtitle="Success Rate" icon={<TargetIcon />} color="#ed6c02" />
                    
                    <StatCard title="Present BAs" value={stats?.presentBAs || '0'} 
                        subtitle="Daily Attendance" icon={<Groups />} color="#2e7d32" />
                    
                    <StatCard title="Active Stores" value={stats?.activeStores || '0'} 
                        subtitle="Working Outlets" icon={<Storefront />} color="#0288d1" />
                </Box>
            )}
        </Box>
    );
};

const StatCard = ({ title, value, subtitle, icon, color }) => (
    <Paper elevation={0} sx={{
        p: 2, 
        flex: 1, 
        minWidth: '190px', 
        height: '200px', 
        borderRadius: '20px', 
        border: '1px solid #eef2f6',
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'flex-start',
        bgcolor: '#fff',
        transition: 'all 0.3s ease',
        '&:hover': { boxShadow: '0 12px 24px rgba(0,0,0,0.06)', transform: 'translateY(-5px)' }
    }}>
        <Box sx={{ 
            p: 1.2, borderRadius: '14px', bgcolor: `${color}10`, color: color, 
            mb: 2, display: 'inline-flex' 
        }}>
            {React.cloneElement(icon, { sx: { fontSize: 26 } })}
        </Box>

        <Typography sx={{ color: '#90a4ae', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 1.2, mb: 0.5 }}>
            {title}
        </Typography>

        <Typography sx={{ fontWeight: 900, color: '#1a203e', fontSize: '1.2rem', lineHeight: 1.1, mb: 1 }}>
            {value}
        </Typography>

        <Box sx={{  width: '100%' }}>
            <Divider sx={{ mb: 1, opacity: 0.4 }} />
            <Typography sx={{ color: '#78909c', fontWeight: 600, fontSize: '0.7rem' }}>
                {subtitle}
            </Typography>
        </Box>
    </Paper>
);

export default Dashboard;