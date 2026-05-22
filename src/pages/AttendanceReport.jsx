import React, { useEffect, useState, useMemo } from 'react';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Button, CircularProgress,
    MenuItem, Chip, IconButton, Divider
} from '@mui/material';
import { LocationOn, Visibility, Assessment, FilterAlt } from '@mui/icons-material';
import API from '../api/API';
import { handleExportToExcel } from '../utils/exportUtils.js';

const AttendanceReport = () => {
    // Data States
    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(false);
    const [cities, setCities] = useState([]);
    const [stores, setStores] = useState([]);
    const [users, setUsers] = useState([]);
    const [channels, setChannels] = useState([]);

    const [summary, setSummary] = useState({
        total: 0,
        present: 0,
        absent: 0,
        presentPercentage: '0%',
        absentPercentage: '0%'
    });

    // Filter States
    const [filters, setFilters] = useState({
        fromDate: format(new Date(), 'yyyy-MM-dd'),
        toDate: format(new Date(), 'yyyy-MM-dd'),
        city_id: '',
        store_id: '',
        ba_id: '',
        status: '',
        channel_id: ''
    });

    const handleGenerateReport = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/reports/attendance-report`, { params: filters });
            setReport(res.data?.data || []);
            setSummary(res.data?.summary || { total: 0, present: 0, absent: 0, presentPercentage: '0%', absentPercentage: '0%' });
        } catch (err) {
            alert("Report nikaalne mein masla hua hai!");
        } finally {
            setLoading(false);
        }
    };

    // Safe Initialization with Memory Leak Guardrails
    useEffect(() => {
        let isMounted = true;

        const fetchFiltersData = async () => {
            try {
                const [c, s, u, ch] = await Promise.all([
                    API.get('/cities'),
                    API.get('/store?limit=1000'),
                    API.get('/users?limit=1000'),
                    API.get('/channels/getchannels')
                ]);

                if (!isMounted) return;

                setCities(c.data || []);
                setStores(s.data?.stores || []);
                setChannels(ch.data || []);

                const baUsersOnly = (u.data?.users || []).filter(user =>
                    user.designation && user.designation.name === "BA"
                );
                setUsers(baUsersOnly);
            } catch (err) {
                console.error("Dropdown Data Error:", err);
            }
        };

        fetchFiltersData();
        return () => {
            isMounted = false; // Prevents updating state on unmounted components
        };
    }, []);

    // 1. Channel + ACTIVE STORES optimization strategy applied here
    const filteredStores = useMemo(() => {
        // Enforce checking store status. Adjust 'status' field name according to your DB schema
        const activeStores = stores.filter(s => s.status === 'active' || s.is_active === true || s.isActive === 1);

        if (!filters.channel_id) return activeStores;
        return activeStores.filter(s => String(s.channel_id) === String(filters.channel_id) || String(s.channelId) === String(filters.channel_id));
    }, [filters.channel_id, stores]);

    // 2. City Filter chain on Active Stores
    const cityAndChannelFilteredStores = useMemo(() => {
        if (!filters.city_id) return filteredStores;
        return filteredStores.filter(s => String(s.city_id) === String(filters.city_id));
    }, [filters.city_id, filteredStores]);

    // Hash map calculation to maintain constant O(1) time complexity search inside rendering cycles
    const storeMap = useMemo(() => {
        const map = new Map();
        for (let i = 0; i < stores.length; i++) {
            map.set(String(stores[i].id), stores[i]);
        }
        return map;
    }, [stores]);

    const filteredUsers = useMemo(() => {
        if (!filters.store_id) return users;

        // O(1) Search execution instead of linear nested array search loop iterations
        const selectedStore = storeMap.get(String(filters.store_id));

        if (selectedStore) {
            const relevantUserIds = [
                selectedStore.ba_user_id,
                selectedStore.ba_user_id_2
            ].filter(id => id !== null && id !== undefined).map(id => String(id));

            return users.filter(u => relevantUserIds.includes(String(u.id)));
        }

        return [];
    }, [filters.store_id, users, storeMap]);

    const getRowSpans = (data) => {
        const spans = [];
        let i = 0;
        while (i < data.length) {
            let count = 1;
            while (i + count < data.length && data[i + count].date === data[i].date) {
                count++;
            }
            spans.push(count);
            for (let j = 1; j < count; j++) spans.push(0);
            i += count;
        }
        return spans;
    };

    const rowSpans = useMemo(() => getRowSpans(report), [report]);

    const filterBoxStyle = { flex: 1, minWidth: '150px' };

    const downloadExcel = () => {
        if (report.length === 0) {
            alert("please generate report first");
            return;
        }

        const formattedData = report.map(row => ({
            "Date": row.date,
            "City": row.city,
            "Channel": row.channelName || row.channel?.name || 'N/A',
            "Area": row.area || 'N/A',
            "Store Name": row.storeName,
            "BA Name": row.baName,
            "Time": row.time || '00:00',
            "Status": row.attendance
        }));

        handleExportToExcel(formattedData, "Attendance_Report");
    };

    const handleChannelChange = (e) => {
        setFilters(prev => ({
            ...prev,
            channel_id: e.target.value,
            store_id: '',
            ba_id: ''
        }));
    };

    const handleCityChange = (e) => {
        setFilters(prev => ({
            ...prev,
            city_id: e.target.value,
            store_id: ''
        }));
    };

    const handleStoreChange = (e) => {
        setFilters(prev => ({
            ...prev,
            store_id: e.target.value,
            ba_id: ''
        }));
    };

    return (
        <Box component="main" sx={{ p: 2, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
                flexWrap: 'wrap',
                gap: 2
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Assessment sx={{ mr: 1, color: '#ab1d47' }} aria-hidden="true" />
                    <Typography component="h1" variant="h6" sx={{ fontWeight: 'bold', color: '#1b2142' }}>
                        Attendance Report
                    </Typography>
                </Box>

                <Paper
                    role="region"
                    aria-label="Attendance Summary Metrics"
                    sx={{
                        display: 'flex',
                        gap: 4,
                        p: 1.2,
                        px: 3,
                        bgcolor: '#1b2142',
                        color: 'white',
                        borderRadius: 2,
                        alignItems: 'center',
                        boxShadow: '0px 4px 10px rgba(0,0,0,0.15)',
                        mb: 0
                    }}
                >
                    <Box>
                        <Typography variant="caption" id="lbl-total-bas" sx={{ color: '#aaa', display: 'block', lineHeight: 1, fontSize: '0.65rem' }}>Total BAs</Typography>
                        <Typography variant="body2" aria-labelledby="lbl-total-bas" sx={{ fontWeight: 'bold' }}>{summary.total}</Typography>
                    </Box>

                    <Divider orientation="vertical" flexItem sx={{ bgcolor: '#444', height: '25px', alignSelf: 'center' }} />

                    <Box>
                        <Typography variant="caption" id="lbl-present" sx={{ color: '#aaa', display: 'block', lineHeight: 1, fontSize: '0.65rem' }}>Present</Typography>
                        <Typography variant="body2" aria-labelledby="lbl-present" sx={{ fontWeight: 'bold', color: '#4caf50' }}>{summary.present}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: '#4caf50', fontSize: '0.65rem', mt: -0.3 }}>({summary.presentPercentage})</Typography>
                    </Box>

                    <Divider orientation="vertical" flexItem sx={{ bgcolor: '#444', height: '25px', alignSelf: 'center' }} />

                    <Box>
                        <Typography variant="caption" id="lbl-leave" sx={{ color: '#aaa', display: 'block', lineHeight: 1, fontSize: '0.65rem' }}>Leave</Typography>
                        <Typography variant="body2" aria-labelledby="lbl-leave" sx={{ fontWeight: 'bold', color: '#ff5252' }}>{summary.absent}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: '#ff5252', fontSize: '0.65rem', mt: -0.3 }}>({summary.absentPercentage})</Typography>
                    </Box>
                </Paper>
            </Box>

            <Paper component="section" aria-label="Filters Panel" sx={{ p: 1.5, mb: 1.5, borderRadius: 2, boxShadow: '0px 1px 5px rgba(0,0,0,0.08)' }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                        <Box sx={filterBoxStyle}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666', mb: 0.2, display: 'block', fontSize: '0.7rem' }}>From Date</Typography>
                            <DatePicker
                                value={new Date(filters.fromDate)}
                                onChange={(v) => setFilters({ ...filters, fromDate: format(v, 'yyyy-MM-dd') })}
                                slotProps={{ textField: { size: 'small', fullWidth: true, sx: { '& .MuiInputBase-input': { py: 0.8 } } } }}
                            />
                        </Box>
                        <Box sx={filterBoxStyle}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666', mb: 0.2, display: 'block', fontSize: '0.7rem' }}>To Date</Typography>
                            <DatePicker
                                value={new Date(filters.toDate)}
                                onChange={(v) => setFilters({ ...filters, toDate: format(v, 'yyyy-MM-dd') })}
                                slotProps={{ textField: { size: 'small', fullWidth: true, sx: { '& .MuiInputBase-input': { py: 0.8 } } } }}
                            />
                        </Box>
                        <Box sx={filterBoxStyle}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666', mb: 0.2, display: 'block', fontSize: '0.7rem' }}>City</Typography>
                            <TextField select fullWidth size="small" value={filters.city_id} onChange={handleCityChange} inputProps={{ 'aria-label': 'Filter by City' }}>
                                <MenuItem value="">All Cities</MenuItem>
                                {cities.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                            </TextField>
                        </Box>

                        <Box sx={filterBoxStyle}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666', mb: 0.2, display: 'block', fontSize: '0.7rem' }}>Channel</Typography>
                            <TextField select fullWidth size="small" value={filters.channel_id} onChange={handleChannelChange} inputProps={{ 'aria-label': 'Filter by Channel' }}>
                                <MenuItem value="">All Channels</MenuItem>
                                {channels.map(ch => <MenuItem key={ch.id} value={ch.id}>{ch.name}</MenuItem>)}
                            </TextField>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
                        <Box sx={filterBoxStyle}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666', mb: 0.2, display: 'block', fontSize: '0.7rem' }}>Store</Typography>
                            <TextField select fullWidth size="small" value={filters.store_id} onChange={handleStoreChange} inputProps={{ 'aria-label': 'Filter by Store' }}>
                                <MenuItem value="">All Stores</MenuItem>
                                {cityAndChannelFilteredStores.map(s => (
                                    <MenuItem key={s.id} value={s.id}>{s.store_name} {s.area ? `(${s.area})` : ''}</MenuItem>
                                ))}
                            </TextField>
                        </Box>
                        <Box sx={filterBoxStyle}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666', mb: 0.2, display: 'block', fontSize: '0.7rem' }}>BA Name</Typography>
                            <TextField select fullWidth size="small" value={filters.ba_id} onChange={(e) => setFilters({ ...filters, ba_id: e.target.value })} inputProps={{ 'aria-label': 'Filter by BA Name' }}>
                                <MenuItem value="">All BAs</MenuItem>
                                {filteredUsers.map(u => <MenuItem key={u.id} value={u.id}>{u.fullname || u.name}</MenuItem>)}
                            </TextField>
                        </Box>
                        <Box sx={filterBoxStyle}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666', mb: 0.2, display: 'block', fontSize: '0.7rem' }}>Status</Typography>
                            <TextField select fullWidth size="small" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} inputProps={{ 'aria-label': 'Filter by Attendance Status' }}>
                                <MenuItem value="">Both</MenuItem>
                                <MenuItem value="present">Present</MenuItem>
                                <MenuItem value="absent">Leave</MenuItem>
                            </TextField>
                        </Box>

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
                                disabled={loading || report.length === 0}
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

            <TableContainer component={Paper} sx={{ maxHeight: '60vh', borderRadius: 2 }}>
                <Table stickyHeader size="small" aria-label="Detailed Attendance Log Records">
                    <TableHead>
                        <TableRow>
                            {["Date", "City", "Channel", "Area", "Store Name", "BA Name", "Time", "Status", "Picture", "GPS"].map(h => (
                                <TableCell key={h} align="center" sx={{ bgcolor: '#1b2142', color: 'white', fontWeight: 'bold', py: 1.2, border: '1px solid #2e3558' }}>{h}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={10} align="center" sx={{ py: 8 }}><CircularProgress color="secondary" /></TableCell></TableRow>
                        ) : report.length > 0 ? (
                            report.map((row, index) => {
                                const span = rowSpans[index];
                                return (
                                    <TableRow key={index} hover sx={{ '& td': { border: '1px solid #eee' } }}>
                                        {span > 0 && (
                                            <TableCell rowSpan={span} align="center" sx={{ fontWeight: 'bold', bgcolor: '#f9f9fb', verticalAlign: 'middle' }}>
                                                {row.date}
                                            </TableCell>
                                        )}
                                        <TableCell align="center">{row.city}</TableCell>
                                        <TableCell align="center">
                                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#7b1fa2' }}>
                                                {row.channelName || row.channel?.name || '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">{row.area || 'N/A'}</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600 }}>{row.storeName}</TableCell>
                                        <TableCell align="center">{row.baName}</TableCell>
                                        <TableCell align="center" sx={{ color: '#ab1d47', fontWeight: 'bold' }}>{row.time || '00:00'}</TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={row.attendance === 'Present' ? 'Present' : 'Leave'}
                                                size="small"
                                                sx={{
                                                    height: '22px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold',
                                                    bgcolor: row.attendance === 'Present' ? '#e8f5e9' : '#ffebee',
                                                    color: row.attendance === 'Present' ? '#2e7d32' : '#c62828'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            {row.picture && row.picture !== "No Picture" ? (
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => window.open(row.picture, '_blank')}
                                                    aria-label={`View submission picture for BA ${row.baName}`}
                                                >
                                                    <Visibility sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            ) : "-"}
                                        </TableCell>
                                        <TableCell align="center">
                                            {row.attendance === 'Present' && row.location && row.location !== "No Location" ? (
                                                <IconButton
                                                    size="small"
                                                    sx={{ color: '#d32f2f' }}
                                                    onClick={() => window.open(row.location, '_blank')}
                                                    aria-label={`Open Google Maps coordinates location track for BA ${row.baName}`}
                                                >
                                                    <LocationOn sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            ) : (
                                                <Typography variant="caption" sx={{ color: '#ccc' }}>-</Typography>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow><TableCell colSpan={10} align="center" sx={{ py: 4, color: '#999' }}>No records found.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default AttendanceReport;