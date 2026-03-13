import React, { useEffect, useState } from 'react';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Button, CircularProgress, MenuItem
} from '@mui/material';
import { Assessment, FilterAlt } from '@mui/icons-material';
import API from '../api/API';

const InterceptionReport = () => {
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Dropdown States
    const [cities, setCities] = useState([]);
    const [stores, setStores] = useState([]);
    const [users, setUsers] = useState([]);

    const [filters, setFilters] = useState({
        fromDate: format(new Date(), 'yyyy-MM-dd'),
        toDate: format(new Date(), 'yyyy-MM-dd'),
        city_id: '',
        store_id: '',
        ba_user_id: ''
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Parallel fetch for speed
                const [c, s, u] = await Promise.all([
                    API.get('/cities'),
                    API.get('/store?limit=1000'),
                    API.get('/users?limit=1000')
                ]);
                setCities(c.data);
                setStores(s.data.stores || []);
                const baUsersOnly = u.data.users.filter(user =>
                    user.designation && user.designation.name === "BA"
                );
                setUsers(baUsersOnly);
            } catch (err) { console.error("Filter Fetch Error:", err); }
        };
        fetchInitialData();
    }, []);

    const handleGenerateReport = async () => {
        setLoading(true);
        const cleanFilters = Object.fromEntries(
            Object.entries(filters).filter(([_, value]) => value !== "" && value !== null)
        );

        try {
            // End point as per your backend requirement
            const res = await API.get(`/reports/interception-report`, { params: cleanFilters });
            setReportData(res.data.data || []);
        } catch (err) {
            console.error(err);
            alert("Interception data fetch nahi ho saka!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 1.5, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <Assessment sx={{ mr: 1, color: '#ab1d47' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1b2142' }}>
                    Interception & Conversion Report
                </Typography>
            </Box>

            {/* Filter Section */}
            <Paper sx={{ p: 2, mb: 1.5, borderRadius: 2 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <Box sx={{ width: '180px' }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 0.5, display: 'block' }}>From Date</Typography>
                            <DatePicker
                                value={parseISO(filters.fromDate)}
                                onChange={(v) => setFilters({ ...filters, fromDate: format(v, 'yyyy-MM-dd') })}
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                        </Box>
                        <Box sx={{ width: '180px' }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 0.5, display: 'block' }}>To Date</Typography>
                            <DatePicker
                                value={parseISO(filters.toDate)}
                                onChange={(v) => setFilters({ ...filters, toDate: format(v, 'yyyy-MM-dd') })}
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                        </Box>

                        <TextField select label="City" size="small" value={filters.city_id}
                            onChange={(e) => setFilters({ ...filters, city_id: e.target.value, store_id: '' })}
                            sx={{ minWidth: '150px' }}>
                            <MenuItem value="">All Cities</MenuItem>
                            {cities.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                        </TextField>

                        <TextField select label="Store" size="small" value={filters.store_id}
                            onChange={(e) => setFilters({ ...filters, store_id: e.target.value })}
                            sx={{ minWidth: '200px' }}>
                            <MenuItem value="">All Stores</MenuItem>
                            {stores.filter(s => !filters.city_id || String(s.city_id) === String(filters.city_id)).map(s => (
                                <MenuItem key={s.id} value={s.id}>{s.store_name}</MenuItem>
                            ))}
                        </TextField>

                        <TextField select label="BA Name" size="small" value={filters.ba_user_id}
                            onChange={(e) => setFilters({ ...filters, ba_user_id: e.target.value })}
                            sx={{ minWidth: '180px' }}>
                            <MenuItem value="">All BAs</MenuItem>
                            {users.map(u => <MenuItem key={u.id} value={u.id}>{u.fullname || u.name}</MenuItem>)}
                        </TextField>

                        <Button
                            variant="contained"
                            onClick={handleGenerateReport}
                            disabled={loading}
                            sx={{
                                bgcolor: '#ab1d47',
                                height: '40px',
                                fontWeight: 'bold',
                                '&:hover': { bgcolor: '#8e183a' }
                            }}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FilterAlt />}
                        >
                            {loading ? "LOADING..." : "GENERATE"}
                        </Button>
                    </Box>
                </LocalizationProvider>
            </Paper>

            {/* Table Section */}
            <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 200px)', borderRadius: 2 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {["Date", "City", "Store Name", "BA Name", "Intercepted", "Converted", "Ratio (%)"].map(h => (
                                <TableCell key={h} align="center" sx={{ bgcolor: '#1b2142', color: 'white', fontWeight: 'bold', fontSize: '12px', py: 1.5 }}>
                                    {h}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={7} align="center" sx={{ py: 10 }}><CircularProgress /></TableCell></TableRow>
                        ) : reportData.length > 0 ? (
                            reportData.map((row, idx) => (
                                <TableRow key={idx} hover sx={{ '& td': { fontSize: '12px' } }}>
                                    <TableCell align="center">{row.report_date}</TableCell>
                                    <TableCell align="center">{row.store?.city?.name || 'N/A'}</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 500 }}>{row.store?.store_name}</TableCell>
                                    <TableCell align="center">{row.beauty_advisor?.name || row.baName}</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>{row.intercepted}</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', color: '#1b2142' }}>{row.converted}</TableCell>
                                    <TableCell align="center" sx={{ color: '#ab1d47', fontWeight: 'bold' }}>
                                        {row.ratio}%
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 5, color: '#999' }}>
                                    No interception data found. Select filters and click Generate.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default InterceptionReport;