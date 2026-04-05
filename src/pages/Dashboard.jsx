import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Button,
    CircularProgress, Stack, Divider, TextField, Tooltip, IconButton, Grid
} from '@mui/material';
import {
    AdsClick as TargetIcon,
    TrendingUp, Groups, Storefront, BarChart, RestartAlt
} from '@mui/icons-material';
import moment from 'moment';
import API from '../api/API';
// Make sure to create and import this new component
import SalesTrendChart from '../components/SalesTrendChart';
import RegionSalesChart from '../components/RegionSalesChart';
import CategoryPerformance from '../components/CategoryPerformance';
import StoreWisePerformance from '../components/StoreWisePerformance.jsx';
import { formatCompactNumber } from "../utils/formatter.js"

const Dashboard = () => {
    const initialCustomDates = {
        start: moment().startOf('month').format('YYYY-MM-DD'),
        end: moment().format('YYYY-MM-DD')
    };

    const [range, setRange] = useState('this_week');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [customDates, setCustomDates] = useState(initialCustomDates);

    // Naya state charts ke data ke liye (API aane tak empty array rakh sakte ho)
    const [trendData, setTrendData] = useState([]);
    const [categories, setCategories] = useState([]);
    const [regionData, setRegionData] = useState([]);
    const [categoryData, setCategoryData] = useState(null);


    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            let params = `?range=${range}`;
            if (range === 'custom') {
                params += `&startDate=${customDates.start}&endDate=${customDates.end}`;
            }

            const [statsRes, trendRes, regionRes, catRes] = await Promise.all([
                API.get(`/dashboard/stats${params}`),
                API.get(`/dashboard/sales-trend${params}`),
                API.get(`/dashboard/regionwise-sale${params}`),
                API.get(`/dashboard/categorywise-performance${params}`)
            ]);

            setStats(statsRes.data.data);
            setTrendData(trendRes.data.data || []);
            setCategories(trendRes.data.categories || []);
            setRegionData(regionRes.data.data || []);
            setCategoryData(catRes.data);
        } catch (err) {
            console.error("Dashboard Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    }, [range, customDates]);

    useEffect(() => {
        if (range !== 'custom') fetchDashboardData();
    }, [range, fetchDashboardData]);

    const handleReset = () => {
        setRange('this_week');
        setCustomDates(initialCustomDates);
    };

    return (
        <Box sx={{ p: 3, bgcolor: '#f4f7f9', minHeight: '100vh', overflowX: 'hidden' }}>

            {/* --- TUMHARA ORIGINAL HEADER --- */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#1a203e', letterSpacing: '-0.5px' }}>
                        Sales Command Center
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666', fontWeight: 600 }}>
                        {moment().format('dddd, MMMM DD, YYYY')}
                    </Typography>
                </Box>

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
                                bgcolor: '#fff', border: '1px solid #e0e6ed', borderRadius: '12px',
                                width: 40, height: 40,
                                '&:hover': { bgcolor: '#f5f5f5', color: '#ab1d47' }
                            }}
                        >
                            <RestartAlt fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Stack>

            {/* --- TUMHARA ORIGINAL CUSTOM FILTER --- */}
            {range === 'custom' && (
                <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: '12px', border: '1px solid #ab1d4720', bgcolor: '#fff' }}>
                    <Stack direction="row" spacing={2} justifyContent="flex-end" alignItems="center">
                        <TextField type="date" label="Start" size="small" InputLabelProps={{ shrink: true }}
                            value={customDates.start} onChange={(e) => setCustomDates({ ...customDates, start: e.target.value })} />
                        <TextField type="date" label="End" size="small" InputLabelProps={{ shrink: true }}
                            value={customDates.end} onChange={(e) => setCustomDates({ ...customDates, end: e.target.value })} />
                        <Button variant="contained" size="small" onClick={fetchDashboardData} sx={{ bgcolor: '#ab1d47', fontWeight: 700, px: 3 }}>Apply</Button>
                    </Stack>
                </Paper>
            )}

            {/* --- TUMHARA ORIGINAL KPI ROW --- */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: '#ab1d47' }} /></Box>
            ) : (
                <Box sx={{
                    display: 'flex', gap: 2, width: '100%', flexWrap: 'nowrap', overflowX: 'auto', pb: 1
                }}>
                    <StatCard title="Total Revenue" value={`Rs ${formatCompactNumber(stats?.totalRevenue)}`}
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

            {/* =========================================================
                NAYA SECTION: ALAG, SAFE AUR RESPONSIVE CHARTS 
                Yeh section purane element se bilkul alag hai.
            ========================================================= */}
            {!loading && (
                <Box
                    component="section"
                    aria-label="Sales Analytics Charts"
                    sx={{ mt: 4, width: '100%' }}
                >
                    <Grid container spacing={3}>

                        {/* LEFT CHART: Sales Trend (Occupies 8/12 grid space on desktop) */}
                        <Grid item xs={12} lg={8}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: '20px',
                                    border: '1px solid #eef2f6',
                                    bgcolor: '#fff',
                                    width: '641px',
                                    height: '420px', // Fixed height taake layout shrink na ho
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1a203e' }}>
                                    Sales Trend by Brand
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#90a4ae', mb: 3 }}>
                                    Daily revenue across all brands
                                </Typography>

                                {/* Chart Container */}
                                <Box sx={{ flexGrow: 1, minHeight: 0, width: '100%' }}>
                                    <SalesTrendChart data={trendData} categories={categories} />
                                </Box>
                            </Paper>
                        </Grid>

                        {/* RIGHT CHART: Region-wise Sales (Occupies 4/12 grid space on desktop) */}
                        {/* RIGHT CHART SECTION MEIN YEH CHANGE KARO */}
                        <Grid item xs={12} lg={4}>
                            <Paper elevation={0} sx={{
                                p: 3, borderRadius: '20px', border: '1px solid #eef2f6',
                                bgcolor: '#fff', width: '350px', height: '420px',
                                display: 'flex', flexDirection: 'column'
                            }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1a203e' }}>
                                    Region-wise Sales
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#90a4ae', mb: 3 }}>
                                    Revenue distribution by region
                                </Typography>

                                <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                                    <RegionSalesChart data={regionData} />
                                </Box>
                            </Paper>
                        </Grid>


                        <Grid container spacing={4} sx={{ mt: 1 }}> {/* mt: 1 spacing ke liye */}


                            {/* Right Side: Category Performance (Stays at 4 units) */}
                            <Grid item xs={12} lg={4}>
                                {categoryData && <CategoryPerformance responseData={categoryData} />}
                            </Grid>

                            {/* Left Side: Store Wise (Stretched to 8 units) */}
                            <Grid item xs={12} lg={8}>
                                <StoreWisePerformance />
                            </Grid>


                        </Grid>


                    </Grid>





                </Box>
            )}

        </Box>
    );
};

// Tumhara original StatCard component
const StatCard = ({ title, value, subtitle, icon, color }) => (
    <Paper elevation={0} sx={{
        p: 2, flex: 1, minWidth: '190px', height: '200px', borderRadius: '20px',
        border: '1px solid #eef2f6', display: 'flex', flexDirection: 'column',
        alignItems: 'flex-start', bgcolor: '#fff', transition: 'all 0.3s ease',
        '&:hover': { boxShadow: '0 12px 24px rgba(0,0,0,0.06)', transform: 'translateY(-5px)' }
    }}>
        <Box sx={{ p: 1.2, borderRadius: '14px', bgcolor: `${color}10`, color: color, mb: 2, display: 'inline-flex' }}>
            {React.cloneElement(icon, { sx: { fontSize: 26 } })}
        </Box>
        <Typography sx={{ color: '#90a4ae', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 1.2, mb: 0.5 }}>
            {title}
        </Typography>
        <Typography sx={{ fontWeight: 900, color: '#1a203e', fontSize: '1.2rem', lineHeight: 1.1, mb: 1 }}>
            {value}
        </Typography>
        <Box sx={{ width: '100%' }}>
            <Divider sx={{ mb: 1, opacity: 0.4 }} />
            <Typography sx={{ color: '#78909c', fontWeight: 600, fontSize: '0.7rem' }}>
                {subtitle}
            </Typography>
        </Box>
    </Paper>
);

export default Dashboard;