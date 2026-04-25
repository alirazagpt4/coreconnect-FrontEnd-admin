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
        fromDate: new Date().toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0],
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
            setReport(res.data.data);
            setSummary(res.data.summary);
            console.log(res.data);
        } catch (err) {
            alert("Report nikaalne mein masla hua hai!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchFiltersData = async () => {
            try {
                const [c, s, u, ch] = await Promise.all([
                    API.get('/cities'),
                    API.get('/store?limit=1000'),
                    API.get('/users?limit=1000'),
                    API.get('/channels/getchannels')
                ]);
                setCities(c.data);
                setStores(s.data.stores);
                console.log("stores", s.data.stores)
                setChannels(ch.data || []);
                // JSON ke mutabiq designation.name "BA" hona chahiye
                const baUsersOnly = u.data.users.filter(user =>
                    user.designation && user.designation.name === "BA"
                );

                setUsers(baUsersOnly);
            } catch (err) { console.error("Dropdown Data Error:", err); }
        };
        fetchFiltersData();
    }, []);



    // 1. Channel ke mutabiq Stores filter karein
    const filteredStores = useMemo(() => {
        if (!filters.channel_id) return stores;
        return stores.filter(s => s.channel_id === filters.channel_id || s.channelId === filters.channel_id);
    }, [filters.channel_id, stores]);

    // 2. City ke mutabiq mazeed filter (Double Dependence)
    const cityAndChannelFilteredStores = useMemo(() => {
        if (!filters.city_id) return filteredStores;
        return filteredStores.filter(s => s.city_id === filters.city_id);
    }, [filters.city_id, filteredStores]);

    const filteredUsers = useMemo(() => {
        // Agar koi store select nahi hai, toh purana filter (BAs only) dikhao
        if (!filters.store_id) return users;

        // 1. Selected store ka pura object dhoondo
        const selectedStore = stores.find(s => String(s.id) === String(filters.store_id));

        if (selectedStore) {
            // 2. Dono possible BA IDs ko ek array mein rakho (null filter kar do)
            const relevantUserIds = [
                selectedStore.ba_user_id,
                selectedStore.ba_user_id_2
            ].filter(id => id !== null);

            // 3. Users array mein se sirf wo log nikalo jo in IDs mein hain
            return users.filter(u =>
                relevantUserIds.includes(Number(u.id)) ||
                relevantUserIds.includes(String(u.id))
            );
        }

        return [];
    }, [filters.store_id, users, stores]);

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

    const rowSpans = getRowSpans(report);

    // Common Style for equal boxes
    const filterBoxStyle = { flex: 1, minWidth: '150px' };


    // download to excel
    const downloadExcel = () => {
        if (report.length === 0) {
            alert("please generate report first");
            return;
        }

        // Data ko format kar rahe hain (Sirf zaroori columns)
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

        // Utility function ko call kar rahe hain
        handleExportToExcel(formattedData, "Attendance_Report");
    };



    const handleChannelChange = (e) => {
        const val = e.target.value;
        setFilters(prev => ({
            ...prev,
            channel_id: val,
            store_id: '', // Reset Store when Channel changes
            ba_id: ''     // Reset BA when Channel changes
        }));
    };

    const handleCityChange = (e) => {
        const val = e.target.value;
        setFilters(prev => ({
            ...prev,
            city_id: val,
            store_id: '' // Reset Store when City changes
        }));
    };

    const handleStoreChange = (e) => {
        const val = e.target.value;
        setFilters(prev => ({
            ...prev,
            store_id: val,
            ba_id: '' // Reset BA when Store changes
        }));
    };


    return (
        <Box sx={{ p: 2, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between', // Ye left aur right balance karega
                mb: 2,
                flexWrap: 'wrap', // Mobile par overlap na ho isliye
                gap: 2
            }}>
                {/* Left Side: Title Section */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Assessment sx={{ mr: 1, color: '#ab1d47' }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1b2142' }}>
                        Attendance Report
                    </Typography>
                </Box>

                {/* Right Side: Summary Header */}

                <Paper sx={{
                    display: 'flex',
                    gap: 4,
                    p: 1.2,
                    px: 3,
                    bgcolor: '#1b2142',
                    color: 'white',
                    borderRadius: 2,
                    alignItems: 'center',
                    boxShadow: '0px 4px 10px rgba(0,0,0,0.15)',
                    // Margin bottom hata diya kyunki ab ye title ke saath align hai
                    mb: 0
                }}>
                    {/* Total Box */}
                    <Box>
                        <Typography variant="caption" sx={{ color: '#aaa', display: 'block', lineHeight: 1, fontSize: '0.65rem' }}>Total BAs</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{summary.total}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: '#1b2142', fontSize: '0.6rem', mt: -0.3 }}>_</Typography>
                    </Box>

                    <Divider orientation="vertical" flexItem sx={{ bgcolor: '#444', height: '25px', alignSelf: 'center' }} />

                    {/* Present Box */}
                    <Box>
                        <Typography variant="caption" sx={{ color: '#aaa', display: 'block', lineHeight: 1, fontSize: '0.65rem' }}>Present</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#4caf50' }}>{summary.present}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: '#4caf50', fontSize: '0.65rem', mt: -0.3 }}>({summary.presentPercentage})</Typography>
                    </Box>

                    <Divider orientation="vertical" flexItem sx={{ bgcolor: '#444', height: '25px', alignSelf: 'center' }} />

                    {/* Absent Box */}
                    <Box>
                        <Typography variant="caption" sx={{ color: '#aaa', display: 'block', lineHeight: 1, fontSize: '0.65rem' }}>Leave</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#ff5252' }}>{summary.absent}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: '#ff5252', fontSize: '0.65rem', mt: -0.3 }}>({summary.absentPercentage})</Typography>
                    </Box>
                </Paper>

            </Box>

            {/* ATTENDANCE SUMMARY HEADER */}




            <Paper sx={{ p: 1.5, mb: 1.5, borderRadius: 2, boxShadow: '0px 1px 5px rgba(0,0,0,0.08)' }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>

                    {/* ROW 1: From Date, To Date, City */}
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
                            <TextField select fullWidth size="small" value={filters.city_id} onChange={handleCityChange}>
                                <MenuItem value="">All Cities</MenuItem>
                                {cities.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                            </TextField>
                        </Box>

                        {/* 👇 New Channel Filter */}
                        <Box sx={filterBoxStyle}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666', mb: 0.2, display: 'block', fontSize: '0.7rem' }}>Channel</Typography>
                            <TextField select fullWidth size="small" value={filters.channel_id} onChange={handleChannelChange}>
                                <MenuItem value="">All Channels</MenuItem>
                                {channels.map(ch => <MenuItem key={ch.id} value={ch.id}>{ch.name}</MenuItem>)}
                            </TextField>
                        </Box>
                    </Box>

                    {/* ROW 2: Store, BA Name, Status + Generate Button */}
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
                        <Box sx={filterBoxStyle}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666', mb: 0.2, display: 'block', fontSize: '0.7rem' }}>Store</Typography>
                            <TextField select fullWidth size="small" value={filters.store_id} onChange={handleStoreChange}>
                                <MenuItem value="">All Stores</MenuItem>
                                {cityAndChannelFilteredStores.map(s => (
                                    <MenuItem key={s.id} value={s.id}>{s.store_name} {s.area ? `(${s.area})` : ''}</MenuItem>
                                ))}
                            </TextField>
                        </Box>
                        <Box sx={filterBoxStyle}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666', mb: 0.2, display: 'block', fontSize: '0.7rem' }}>BA Name</Typography>
                            <TextField select fullWidth size="small" value={filters.ba_id} onChange={(e) => setFilters({ ...filters, ba_id: e.target.value })}>
                                <MenuItem value="">All BAs</MenuItem>
                                {filteredUsers.map(u => <MenuItem key={u.id} value={u.id}>{u.fullname || u.name}</MenuItem>)}
                            </TextField>
                        </Box>
                        <Box sx={filterBoxStyle}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666', mb: 0.2, display: 'block', fontSize: '0.7rem' }}>Status</Typography>
                            <TextField select fullWidth size="small" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                                <MenuItem value="">Both</MenuItem>
                                <MenuItem value="present">Present</MenuItem>
                                <MenuItem value="absent">Leave</MenuItem>
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
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {["Date", "City", "Channel", "Area", "Store Name", "BA Name", "Time", "Status", "Picture", "GPS"].map(h => (
                                <TableCell key={h} align="center" sx={{ bgcolor: '#1b2142', color: 'white', fontWeight: 'bold', py: 1.2, border: '1px solid #2e3558' }}>{h}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={9} align="center" sx={{ py: 8 }}><CircularProgress color="secondary" /></TableCell></TableRow>
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
                                                // Logic: Agar 'Present' hai toh 'Present', warna hamesha 'Leave' dikhao
                                                label={row.attendance === 'Present' ? 'Present' : 'Leave'}
                                                size="small"
                                                sx={{
                                                    height: '22px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold',
                                                    // Colors bhi automatically 'Leave' ke liye red ho jayenge
                                                    bgcolor: row.attendance === 'Present' ? '#e8f5e9' : '#ffebee',
                                                    color: row.attendance === 'Present' ? '#2e7d32' : '#c62828'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            {row.picture && row.picture !== "No Picture" ? (
                                                <IconButton size="small" color="primary" onClick={() => window.open(row.picture, '_blank')}>
                                                    <Visibility sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            ) : "-"}
                                        </TableCell>
                                        <TableCell align="center">
                                            {/* Sirf tab dikhao jab attendance 'Present' ho AUR location link maujood ho */}
                                            {row.attendance === 'Present' && row.location && row.location !== "No Location" ? (
                                                <IconButton
                                                    size="small"
                                                    sx={{ color: '#d32f2f' }}
                                                    onClick={() => window.open(row.location, '_blank')}
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
                            <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4, color: '#999' }}>No records found.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default AttendanceReport;