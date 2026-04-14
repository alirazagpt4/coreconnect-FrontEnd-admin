import React, { useEffect, useState } from 'react';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Button, CircularProgress, MenuItem, IconButton, Tooltip
} from '@mui/material';
import { Summarize, Search, FileDownload, RestartAlt } from '@mui/icons-material';
import API from '../api/API';
import { handleExportToExcel } from '../utils/exportUtils';

const SummaryReport = () => {
    // Data States
    const [reportData, setReportData] = useState([]);
    const [summary, setSummary] = useState(null);
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
        ba_id: '',
        channel_id: ''
    });

    const brands = ["AMRIJ", "EVERNOYA", "NO!MO!", "RHD", "RIVAJ"];

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [c, s, u, ch] = await Promise.all([
                    API.get('/cities'),
                    API.get('/store?limit=1000'),
                    API.get('/users?limit=1000'),
                    API.get('/channels/getchannels')
                ]);
                setCities(c.data);
                setStores(s.data.stores || []);
                setUsers(u.data.users.filter(user => user.designation?.name === "BA"));
                setChannels(ch.data || []);
            } catch (err) {
                console.error("Initial Fetch Error", err);
            }
        };
        fetchInitialData();
    }, []);

    const handleGenerateReport = async () => {
        setLoading(true);
        // Logic: Sirf wahi filters bhejo jo empty nahi hain
        const cleanFilters = Object.fromEntries(
            Object.entries(filters).filter(([_, v]) => v !== "" && v !== null)
        );
        try {
            const res = await API.get(`/reports/sales-summary-report`, { params: cleanFilters });
            setReportData(res.data.data || []);
            setSummary(res.data.summary || null);
        } catch (err) {
            console.error(err);
            alert("Failed to fetch report data.");
        } finally {
            setLoading(false);
        }
    };

    const handleExcelExport = () => {
        if (!reportData.length) return;
        const excelData = reportData.map(row => {
            const flatRow = {
                'Date': format(parseISO(row.date), 'dd-MM-yyyy'),
                'City': row.city,
                'Channel': row.channel,
                'Store': row.storeName,
                'BA Name': row.baName,
            };
            brands.forEach(brand => {
                flatRow[`${brand} Qty`] = Math.round(row.brands[brand]?.qty || 0);
                flatRow[`${brand} Val`] = Math.round(row.brands[brand]?.val || 0);
            });
            flatRow['Grand Total Qty'] = Math.round(row.rowTotalQty || 0);
            flatRow['Grand Total Val'] = Math.round(row.rowTotalVal || 0);
            return flatRow;
        });
        handleExportToExcel(excelData, `Sales_Summary_${filters.fromDate}_to_${filters.toDate}`);
    };

    const resetFilters = () => {
        setFilters({
            fromDate: format(new Date(), 'yyyy-MM-dd'),
            toDate: format(new Date(), 'yyyy-MM-dd'),
            city_id: '', store_id: '', ba_id: '', channel_id: ''
        });
    };

    const filterFieldStyle = {
        '& .MuiInputBase-root': { height: '32px', fontSize: '12px' },
        '& .MuiInputLabel-root': { fontSize: '11px', transform: 'translate(10px, 8px) scale(1)' },
        '& .MuiInputLabel-shrink': { transform: 'translate(10px, -8px) scale(0.75)' },
        flex: 1, minWidth: '160px'
    };

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f1f3f4' }} component="main">

            {/* MAIN HEADER CONTAINER */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.5,
                px: 2,

                borderBottom: '1px solid #e0e0e0',
                flexWrap: 'wrap',
                gap: 2
            }}>
                {/* Left Side: Title & Icon */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Summarize sx={{ mr: 1, color: '#ab1d47', fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1b2142', fontSize: '1.1rem' }}>
                        Sales Summary Report
                    </Typography>
                </Box>

                {/* Right Side: GRAND TOTAL SUMMARY (Design matched with Daily Sales Report) */}
                {summary && (
                    <Paper elevation={0} sx={{
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
                        {/* Total Qty */}
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: '#aaa', display: 'block', lineHeight: 1, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                                Total Qty
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#ffeb3b' }}>
                                {Math.round(summary.grandTotalQty).toLocaleString()}
                            </Typography>
                        </Box>

                        {/* Vertical Divider (Manual styled box to match your reference) */}
                        <Box sx={{ width: '1px', bgcolor: '#444', height: '25px', alignSelf: 'center' }} />

                        {/* Total Value */}
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: '#aaa', display: 'block', lineHeight: 1, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                                Total Value
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                                Rs. {Math.round(summary.grandTotalVal).toLocaleString()}
                            </Typography>
                        </Box>
                    </Paper>
                )}
            </Box>

            {/* TWO-ROW FILTERS SECTION */}
            <Paper variant="outlined" sx={{ m: 1, p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, borderRadius: '4px' }}>

                {/* Row 1: Time & Basic Geography */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                            label="From"
                            value={parseISO(filters.fromDate)}
                            onChange={(v) => setFilters({ ...filters, fromDate: format(v, 'yyyy-MM-dd') })}
                            slotProps={{ textField: { size: 'small', sx: filterFieldStyle } }}
                        />
                        <DatePicker
                            label="To"
                            value={parseISO(filters.toDate)}
                            onChange={(v) => setFilters({ ...filters, toDate: format(v, 'yyyy-MM-dd') })}
                            slotProps={{ textField: { size: 'small', sx: filterFieldStyle } }}
                        />
                    </LocalizationProvider>

                    <TextField select label="City" size="small" value={filters.city_id} onChange={(e) => setFilters({ ...filters, city_id: e.target.value, store_id: '' })} sx={filterFieldStyle}>
                        <MenuItem value="">All Cities</MenuItem>
                        {cities.map(c => <MenuItem key={c.id} value={c.id} sx={{ fontSize: '12px' }}>{c.name}</MenuItem>)}
                    </TextField>

                    <TextField select label="Channel" size="small" value={filters.channel_id} onChange={(e) => setFilters({ ...filters, channel_id: e.target.value })} sx={filterFieldStyle}>
                        <MenuItem value="">All Channels</MenuItem>
                        {channels.map(ch => <MenuItem key={ch.id} value={ch.id} sx={{ fontSize: '12px' }}>{ch.name}</MenuItem>)}
                    </TextField>
                </Box>

                {/* Row 2: Specific Targets & Buttons */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField select label="Store" size="small" value={filters.store_id} onChange={(e) => setFilters({ ...filters, store_id: e.target.value })} sx={filterFieldStyle}>
                        <MenuItem value="">All Stores</MenuItem>
                        {stores
                            .filter(s => !filters.city_id || String(s.city_id) === String(filters.city_id))
                            .map(s => <MenuItem key={s.id} value={s.id} sx={{ fontSize: '12px' }}>{s.store_name} {s.area ? `(${s.area})` : ''}</MenuItem>)}
                    </TextField>

                    <TextField select label="BA (User)" size="small" value={filters.ba_id} onChange={(e) => setFilters({ ...filters, ba_id: e.target.value })} sx={filterFieldStyle}>
                        <MenuItem value="">All BAs</MenuItem>
                        {users.map(u => <MenuItem key={u.id} value={u.id} sx={{ fontSize: '12px' }}>{u.fullname || u.name}</MenuItem>)}
                    </TextField>

                    <Box sx={{ display: 'flex', gap: 0.8, ml: 'auto' }}>
                        <Tooltip title="Reset Filters">
                            <IconButton
                                onClick={resetFilters}
                                size="small"
                                sx={{ border: '1px solid #ccc', borderRadius: '4px' }}
                            >
                                <RestartAlt fontSize="small" />
                            </IconButton>
                        </Tooltip>

                        <Button
                            variant="contained"
                            onClick={handleGenerateReport}
                            disabled={loading}
                            size="small"
                            sx={{
                                bgcolor: '#ab1d47', // App Standard Red/Maroon
                                height: '32px',
                                minWidth: '120px',
                                fontWeight: 700,
                                fontSize: '11px',
                                '&:hover': { bgcolor: '#8e183b' },
                                '&.Mui-disabled': { bgcolor: '#f5f5f5' }
                            }}
                        >
                            {loading ? (
                                <CircularProgress size={16} color="inherit" />
                            ) : (
                                <>

                                    {loading ? "FETCHING..." : "GENERATE"}
                                </>
                            )}
                        </Button>

                        <Button
                            variant="contained"
                            color="success"
                            onClick={handleExcelExport}
                            disabled={loading || reportData.length === 0}
                            size="small"
                            sx={{
                                height: '32px',
                                minWidth: '100px',
                                fontWeight: 700,
                                fontSize: '11px'
                            }}
                        >
                            <FileDownload sx={{ fontSize: 16, mr: 0.5 }} /> EXCEL
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* Table Area */}
            <Box sx={{ flexGrow: 1, px: 1, pb: 1, overflow: 'hidden' }}>
                <TableContainer component={Paper} sx={{ height: '100%', overflow: 'auto', borderRadius: '4px', boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow sx={{ '& th': { bgcolor: '#1b2142', color: 'white', fontWeight: 800, fontSize: '10px', py: 0.8, borderRight: '1px solid #333' } }}>
                                <TableCell colSpan={5} align="center">BASIC INFO</TableCell>
                                {brands.map(b => <TableCell key={b} colSpan={2} align="center" sx={{ borderRight: '1px solid #333' }}>{b}</TableCell>)}
                                <TableCell colSpan={2} align="center" sx={{ bgcolor: '#004d40' }}>OVERALL TOTAL</TableCell>
                            </TableRow>
                            <TableRow sx={{ '& th': { bgcolor: '#f8f9fa', fontSize: '9px', fontWeight: 'bold', p: '4px', borderRight: '1px solid #eee' } }}>
                                {["Date", "City", "CH", "Store", "BA"].map(h => <TableCell key={h}>{h}</TableCell>)}
                                {[...brands, "GRAND"].map((_, i) => (
                                    <React.Fragment key={i}>
                                        <TableCell align="center" sx={{ color: '#ab1d47' }}>Q</TableCell>
                                        <TableCell align="center" sx={{ color: '#1b2142' }}>V</TableCell>
                                    </React.Fragment>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={20} align="center" sx={{ py: 10 }}><CircularProgress size={30} thickness={4} sx={{ color: '#1b2142' }} /></TableCell></TableRow>
                            ) : reportData.length === 0 ? (
                                <TableRow><TableCell colSpan={20} align="center" sx={{ py: 10, color: '#999' }}>No records found. Adjust filters and try again.</TableCell></TableRow>
                            ) : reportData.map((row, idx) => (
                                <TableRow key={idx} hover sx={{ '& td': { fontSize: '10.5px', p: '4px 8px', borderRight: '1px solid #f1f1f1', whiteSpace: 'nowrap' } }}>
                                    <TableCell>{format(parseISO(row.date), 'dd/MM')}</TableCell>
                                    <TableCell>{row.city}</TableCell>
                                    <TableCell>{row.channel}</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#1b2142' }}>{row.storeName}</TableCell>
                                    <TableCell>{row.baName}</TableCell>
                                    {brands.map(b => (
                                        <React.Fragment key={b}>
                                            <TableCell align="center">{Math.round(row.brands[b]?.qty || 0)}</TableCell>
                                            <TableCell align="right">{Math.round(row.brands[b]?.val || 0).toLocaleString()}</TableCell>
                                        </React.Fragment>
                                    ))}
                                    <TableCell align="center" sx={{ bgcolor: '#f1f8f7', fontWeight: 'bold', color: '#004d40' }}>
                                        {Math.round(row.rowTotalQty)}
                                    </TableCell>
                                    <TableCell align="right" sx={{ bgcolor: '#f1f8f7', fontWeight: 'bold', color: '#004d40' }}>
                                        {Math.round(row.rowTotalVal).toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Box>
    );
};

export default SummaryReport;