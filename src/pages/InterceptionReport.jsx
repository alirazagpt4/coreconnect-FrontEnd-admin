import React, { useEffect, useState } from 'react';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Button, CircularProgress, MenuItem, Divider
} from '@mui/material';
import { Assessment, FilterAlt, AdsClick, ShoppingBag, Percent } from '@mui/icons-material';
import API from '../api/API';
import { handleExportToExcel } from '../utils/exportUtils.js';

const filterBoxStyle = { flex: 1, minWidth: '150px' };

const InterceptionReport = () => {
    const [reportData, setReportData] = useState([]);
    const [summary, setSummary] = useState({
        totalInterceptions: 0,
        totalConversions: 0,
        overallRatio: "0.00"
    });
    const [loading, setLoading] = useState(false);

    // Dropdown States
    const [cities, setCities] = useState([]);
    const [channels, setChannels] = useState([]);
    const [stores, setStores] = useState([]);
    const [users, setUsers] = useState([]);

    const [filters, setFilters] = useState({
        fromDate: format(new Date(), 'yyyy-MM-dd'),
        toDate: format(new Date(), 'yyyy-MM-dd'),
        city_id: '',
        store_id: '',
        ba_user_id: '',
        channel_id: ''
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [c, ch, s, u] = await Promise.all([
                    API.get('/cities'),
                    API.get('/channels/getchannels'),
                    API.get('/store?limit=1000'),
                    API.get('/users?limit=1000')
                ]);
                setCities(c.data);
                setChannels(ch.data);
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
            const res = await API.get(`/reports/interception-report`, { params: cleanFilters });
            setReportData(res.data.data || []);
            setSummary(res.data.summary || { totalInterceptions: 0, totalConversions: 0, overallRatio: "0.00" });
        } catch (err) {
            console.error(err);
            alert("Interception data fetch nahi ho saka!");
        } finally {
            setLoading(false);
        }
    };



    const downloadExcel = () => {
        if (reportData.length === 0) {
            alert("Pehle report generate karein!");
            return;
        }

        // Interception Report ke columns ki mapping
        const formattedData = reportData.map(row => ({
            "Date": row.report_date ? format(parseISO(row.report_date), 'dd MMM yyyy') : 'N/A',
            "Channel": row.store?.channel?.name || 'N/A',
            "City": row.store?.city?.name || 'N/A',
            "Store Name": row.store?.store_name || 'N/A',
            "BA Name": row.beauty_advisor?.name || row.baName || 'N/A',
            "Intercepted": row.intercepted || 0,
            "Converted": row.converted || 0,
            "Ratio (%)": `${row.ratio || 0}%`
        }));

        handleExportToExcel(formattedData, "Interception_Report");
    };



    return (
        <Box sx={{ p: 1.5, bgcolor: '#f4f6f8', minHeight: '100vh' }}>

            {/* TOP HEADER: Title + Summary Card */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
                flexWrap: 'wrap',
                gap: 2
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Assessment sx={{ mr: 1, color: '#ab1d47' }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1b2142' }}>
                        Interception Report
                    </Typography>
                </Box>

                <Paper sx={{
                    display: 'flex',
                    gap: 4,
                    p: 1.2,
                    px: 3,
                    bgcolor: '#1b2142',
                    color: 'white',
                    borderRadius: 2,
                    alignItems: 'center',
                    boxShadow: '0px 4px 10px rgba(0,0,0,0.15)'
                }}>
                    {/* Interceptions Box */}
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#aaa', display: 'block', lineHeight: 1, fontSize: '0.65rem' }}>Total Interceptions</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{summary.totalInterceptions}</Typography>

                    </Box>

                    <Divider orientation="vertical" flexItem sx={{ bgcolor: '#444', height: '35px', alignSelf: 'center' }} />

                    {/* Conversions Box */}
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#aaa', display: 'block', lineHeight: 1, fontSize: '0.65rem' }}>Total Conversions</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#4caf50' }}>{summary.totalConversions}</Typography>

                    </Box>

                    <Divider orientation="vertical" flexItem sx={{ bgcolor: '#444', height: '35px', alignSelf: 'center' }} />

                    {/* Avg Ratio Box */}
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#aaa', display: 'block', lineHeight: 1, fontSize: '0.65rem' }}>Success Rate</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#ffeb3b' }}>{summary.overallRatio}%</Typography>
                    </Box>
                </Paper>
            </Box>

            {/* FILTER SECTION (Two Rows) */}
            <Paper sx={{ p: 1.5, mb: 1.5, borderRadius: 2, boxShadow: '0px 1px 5px rgba(0,0,0,0.08)' }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    {/* ROW 1 */}
                    <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                        <Box sx={filterBoxStyle}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666', mb: 0.2, display: 'block', fontSize: '0.7rem' }}>From Date</Typography>
                            <DatePicker
                                value={parseISO(filters.fromDate)}
                                onChange={(v) => setFilters({ ...filters, fromDate: format(v, 'yyyy-MM-dd') })}
                                slotProps={{ textField: { size: 'small', fullWidth: true, sx: { '& .MuiInputBase-input': { py: 0.8 } } } }}
                            />
                        </Box>
                        <Box sx={filterBoxStyle}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666', mb: 0.2, display: 'block', fontSize: '0.7rem' }}>To Date</Typography>
                            <DatePicker
                                value={parseISO(filters.toDate)}
                                onChange={(v) => setFilters({ ...filters, toDate: format(v, 'yyyy-MM-dd') })}
                                slotProps={{ textField: { size: 'small', fullWidth: true, sx: { '& .MuiInputBase-input': { py: 0.8 } } } }}
                            />
                        </Box>

                        <Box sx={filterBoxStyle}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666', mb: 0.2, display: 'block', fontSize: '0.7rem' }}>Channel</Typography>
                            <TextField select fullWidth size="small" value={filters.channel_id} onChange={(e) => setFilters({ ...filters, channel_id: e.target.value, store_id: '' })}>
                                <MenuItem value="">All Channels</MenuItem>
                                {channels.map(ch => <MenuItem key={ch.id} value={ch.id}>{ch.name}</MenuItem>)}
                            </TextField>
                        </Box>

                        <Box sx={filterBoxStyle}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666', mb: 0.2, display: 'block', fontSize: '0.7rem' }}>City</Typography>
                            <TextField select fullWidth size="small" value={filters.city_id} onChange={(e) => setFilters({ ...filters, city_id: e.target.value, store_id: '' })}>
                                <MenuItem value="">All Cities</MenuItem>
                                {cities.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                            </TextField>
                        </Box>


                    </Box>

                    {/* ROW 2 */}
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
                        <Box sx={filterBoxStyle}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666', mb: 0.2, display: 'block', fontSize: '0.7rem' }}>Store</Typography>
                            <TextField select fullWidth size="small" value={filters.store_id} onChange={(e) => setFilters({ ...filters, store_id: e.target.value })}>
                                <MenuItem value="">All Stores</MenuItem>
                                {stores.filter(s => !filters.city_id || String(s.city_id) === String(filters.city_id)).map(s => (
                                    <MenuItem key={s.id} value={s.id}>{s.store_name}</MenuItem>
                                ))}
                            </TextField>
                        </Box>
                        <Box sx={filterBoxStyle}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666', mb: 0.2, display: 'block', fontSize: '0.7rem' }}>BA Name</Typography>
                            <TextField select fullWidth size="small" value={filters.ba_user_id} onChange={(e) => setFilters({ ...filters, ba_user_id: e.target.value })}>
                                <MenuItem value="">All BAs</MenuItem>
                                {users.map(u => <MenuItem key={u.id} value={u.id}>{u.fullname || u.name}</MenuItem>)}
                            </TextField>
                        </Box>
                        {/* Compact Buttons Container */}
                        <Box sx={{ flex: 0.8, minWidth: '180px', display: 'flex', gap: 1 }}>
                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <FilterAlt sx={{ fontSize: '1.1rem' }} />}
                                onClick={handleGenerateReport}
                                disabled={loading}
                                sx={{
                                    bgcolor: '#ab1d47',
                                    fontWeight: 'bold',
                                    height: '35px',
                                    fontSize: '0.85rem',
                                    '&:hover': { bgcolor: '#8e183a' },
                                    textTransform: 'none'
                                }}
                            >
                                {loading ? 'Wait...' : 'Generate'}
                            </Button>

                            <Button
                                fullWidth
                                variant="contained"
                                color="success"
                                onClick={downloadExcel}
                                disabled={loading || reportData.length === 0}
                                sx={{
                                    bgcolor: '#2e7d32',
                                    fontWeight: 'bold',
                                    height: '35px',
                                    fontSize: '0.85rem',
                                    '&:hover': { bgcolor: '#1b5e20' },
                                    textTransform: 'none'
                                }}
                            >
                                Export
                            </Button>
                        </Box>
                    </Box>
                </LocalizationProvider>
            </Paper>

            {/* TABLE SECTION */}
            <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 280px)', borderRadius: 2 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {["Date", "Channel", "City", "Store Name", "BA Name", "Intercepted", "Converted", "Ratio (%)"].map(h => (
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
                                    {/* Yahan Date format fix kiya hai: 14 Mar 2026 */}
                                    <TableCell align="center">
                                        {row.report_date ? format(parseISO(row.report_date), 'dd MMM yyyy') : 'N/A'}
                                    </TableCell>
                                    <TableCell align="center">{row.store?.channel?.name || 'N/A'}</TableCell>
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