import React, { useEffect, useState } from 'react';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Button, CircularProgress, Stack,
    MenuItem, Grid, Tooltip, Chip, Avatar, IconButton
} from '@mui/material';
import { LocationOn, CalendarMonth, Visibility, Assessment } from '@mui/icons-material';
import API from '../api/API';



const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
    }); // Result: Mar 06, 2026
};

const AttendanceReport = () => {
    // Data States
    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(false);
    const [cities, setCities] = useState([]);
    const [stores, setStores] = useState([]);
    const [users, setUsers] = useState([]);

    // Filter States
    const [filters, setFilters] = useState({
        fromDate: new Date().toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0],
        city_id: '',
        store_id: '',
        ba_id: '',
        status: ''
    });

    // 1. Manual Fetch Function (Sirf Button click par chalega)
    const handleGenerateReport = async () => {
        setLoading(true);
        try {
            const { fromDate, toDate, city_id, store_id, status, ba_id } = filters;
            const res = await API.get(`/reports/attendance-report`, {
                params: { fromDate, toDate, city_id, store_id, status, ba_id }
            });
            setReport(res.data.data);
        } catch (err) {
            console.error("Report Fetch Error:", err);
            alert("Report nikaalne mein masla hua hai!");
        } finally {
            setLoading(false);
        }
    };

    // 2. Fetch Dropdowns on Component Mount
    useEffect(() => {
        const fetchFiltersData = async () => {
            try {
                const [c, s, u] = await Promise.all([
                    API.get('/cities'),
                    API.get('/store'),
                    API.get('/users')
                ]);
                setCities(c.data);

                console.log("citydata end point data", c.data);
                console.log("store end point data", s.data.stores);
                setStores(s.data.stores);
                setUsers(u.data.users)
            } catch (err) { console.error("Dropdown Data Error:", err); }
        };
        fetchFiltersData();
    }, []);





    // Ye function calculate karega ke har date kitni rows tak chal rahi hai
    const getRowSpans = (data) => {
        const spans = [];
        let i = 0;
        while (i < data.length) {
            let count = 1;
            while (i + count < data.length && data[i + count].date === data[i].date) {
                count++;
            }
            spans.push(count); // Store how many rows this date has
            for (let j = 1; j < count; j++) {
                spans.push(0); // Mark following rows with 0 so we skip their date cells
            }
            i += count;
        }
        return spans;
    };

    const rowSpans = getRowSpans(report);

    return (
        <Box sx={{ p: 1 }}>
            {/* Header */}
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#1b2142' }}>
                Attendance Report
            </Typography>

            {/* --- Filters Section --- */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>

                    <Grid container spacing={2} alignItems="flex-end">
                        <Grid item xs={12} sm={2}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666', ml: 1, display: 'block', mb: 0.5 }}>
                                From Date
                            </Typography>
                            <DatePicker
                                value={new Date(filters.fromDate)}
                                onChange={(newValue) => setFilters({ ...filters, fromDate: format(newValue, 'yyyy-MM-dd') })}
                                format="MMM dd, yyyy"
                                slotProps={{
                                    textField: {
                                        size: 'small',
                                        fullWidth: true,
                                        sx: {
                                            '& .MuiInputBase-root': {
                                                height: '35px', // Height kam kar di
                                                fontSize: '0.8rem', // Text thoda chota
                                                bgcolor: 'white'
                                            },
                                            '& .MuiInputBase-input': {
                                                py: 0, // Vertical padding khatam
                                                px: 1  // Side padding kam
                                            },
                                            maxWidth: '160px' // Width control karne ke liye
                                        }
                                    }
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={2}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666', ml: 1, display: 'block', mb: 0.5 }}>
                                To Date
                            </Typography>
                            <DatePicker
                                value={new Date(filters.toDate)}
                                onChange={(newValue) => setFilters({ ...filters, toDate: format(newValue, 'yyyy-MM-dd') })}
                                format="MMM dd, yyyy"
                                slotProps={{
                                    textField: {
                                        size: 'small',
                                        fullWidth: true,
                                        sx: {
                                            '& .MuiInputBase-root': {
                                                height: '35px',
                                                fontSize: '0.8rem',
                                                bgcolor: 'white'
                                            },
                                            '& .MuiInputBase-input': {
                                                py: 0,
                                                px: 1
                                            },
                                            maxWidth: '160px'
                                        }
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={2.5}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666' }}>Select City</Typography>
                            <TextField select fullWidth size="small" value={filters.city_id} onChange={(e) => setFilters({ ...filters, city_id: e.target.value })}>
                                <MenuItem value="">All Cities</MenuItem>
                                {cities.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={2.5}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666' }}>Select Store</Typography>
                            <TextField select fullWidth size="small" value={filters.store_id} onChange={(e) => setFilters({ ...filters, store_id: e.target.value })}>
                                <MenuItem value="">All Stores</MenuItem>
                                {stores.map(s => <MenuItem key={s.id} value={s.id}>{s.store_name}</MenuItem>)}
                            </TextField>
                        </Grid>

                        <Grid item xs={12} sm={2}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666' }}>BA Name</Typography>
                            <TextField select fullWidth size="small" value={filters.ba_id} onChange={(e) => setFilters({ ...filters, ba_id: e.target.value })}>
                                <MenuItem value="">All BAs</MenuItem>
                                {users?.map(u => <MenuItem key={u.id} value={u.id}>{u.fullname || u.name}</MenuItem>)}
                            </TextField>
                        </Grid>

                        <Grid item xs={12} sm={1.5}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666' }}>Status</Typography>
                            <TextField select fullWidth size="small" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                                <MenuItem value="">Both</MenuItem>
                                <MenuItem value="present">Present</MenuItem>
                                <MenuItem value="absent">Absent</MenuItem>
                            </TextField>
                        </Grid>

                        {/* GENERATE BUTTON */}
                        <Grid item xs={12} sm={1.5}>
                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Assessment />}
                                onClick={handleGenerateReport}
                                disabled={loading}
                                sx={{
                                    bgcolor: '#ab1d47',
                                    height: '40px',
                                    '&:hover': { bgcolor: '#8e183a' },
                                    textTransform: 'none',
                                    fontWeight: 'bold'
                                }}
                            >
                                {loading ? 'Wait...' : 'Generate'}
                            </Button>
                        </Grid>
                    </Grid>
                </LocalizationProvider>
            </Paper>

            {/* --- Report Table --- */}
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3, maxHeight: '600px' }}>
                <Table stickyHeader size="small"> {/* 👈 Size small add kar diya */}
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ bgcolor: '#1b2142', color: 'white', fontWeight: 'bold', py: 1 }}>Date</TableCell>
                            <TableCell sx={{ bgcolor: '#1b2142', color: 'white', fontWeight: 'bold', py: 1 }}>City</TableCell>
                            <TableCell sx={{ bgcolor: '#1b2142', color: 'white', fontWeight: 'bold', py: 1 }}>Area</TableCell>
                            <TableCell sx={{ bgcolor: '#1b2142', color: 'white', fontWeight: 'bold', py: 1 }}>Store Name</TableCell>
                            <TableCell sx={{ bgcolor: '#1b2142', color: 'white', fontWeight: 'bold', py: 1 }}>BA Name</TableCell>
                            <TableCell sx={{ bgcolor: '#1b2142', color: 'white', fontWeight: 'bold', py: 1 }}>Time</TableCell>
                            <TableCell sx={{ bgcolor: '#1b2142', color: 'white', fontWeight: 'bold', textAlign: 'center', py: 1 }}>Status</TableCell>
                            <TableCell sx={{ bgcolor: '#1b2142', color: 'white', fontWeight: 'bold', textAlign: 'center', py: 1 }}>Picture</TableCell>
                            <TableCell sx={{ bgcolor: '#1b2142', color: 'white', fontWeight: 'bold', textAlign: 'center', py: 1 }}>GPS</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5 }}><CircularProgress size={25} color="secondary" /></TableCell></TableRow>
                        ) : report.length > 0 ? (
                            report.map((row, index) => {
                                const span = rowSpans[index];
                                return (
                                    <TableRow key={index} hover sx={{ '& td': { py: 0.5, px: 1 } }}> {/* 👈 Row padding tight kar di */}
                                        {span > 0 && (
                                            <TableCell
                                                rowSpan={span}
                                                align="center"
                                                sx={{
                                                    fontWeight: 'bold',
                                                    fontSize: '0.8rem', // Date thodi choti
                                                    color: '#1b2142',
                                                    verticalAlign: 'middle',
                                                    borderRight: '1px solid #ddd',
                                                    bgcolor: '#f9f9fb',
                                                    minWidth: '80px',
                                                    p: 0.5 // Merged cell ki padding kam ki
                                                }}
                                            >
                                                {row.date}
                                            </TableCell>
                                        )}
                                        <TableCell sx={{ fontSize: '0.85rem' }}>{row.city}</TableCell>
                                        <TableCell sx={{ fontSize: '0.85rem' }}>{row.area || 'N/A'}</TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{row.storeName}</TableCell>
                                        <TableCell sx={{ fontSize: '0.85rem' }}>{row.baName}</TableCell>
                                        <TableCell sx={{ color: '#ab1d47', fontWeight: 'bold', fontSize: '0.85rem' }}>{row.time || '00:00'}</TableCell>

                                        <TableCell align="center">
                                            <Chip
                                                label={row.attendance}
                                                size="small"
                                                sx={{
                                                    height: '20px', // Chip ka size aur chota
                                                    fontSize: '0.75rem',
                                                    bgcolor: row.attendance === 'Present' ? '#e8f5e9' : '#ffebee',
                                                    color: row.attendance === 'Present' ? '#2e7d32' : '#c62828',
                                                    fontWeight: 'bold'
                                                }}
                                            />
                                        </TableCell>

                                        <TableCell align="center">
                                            {row.picture && row.picture !== "No Picture" ? (
                                                <IconButton size="small" color="primary" onClick={() => window.open(row.picture, '_blank')}>
                                                    <Visibility sx={{ fontSize: 16 }} /> {/* Icon chota kar diya */}
                                                </IconButton>
                                            ) : "-"}
                                        </TableCell>

                                        <TableCell align="center">
                                            <IconButton
                                                size="small"
                                                sx={{ color: '#d32f2f' }}
                                                onClick={() => window.open(row.location, '_blank')}
                                            >
                                                <LocationOn sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow><TableCell colSpan={9} align="center" sx={{ py: 3 }}>No records found.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default AttendanceReport;