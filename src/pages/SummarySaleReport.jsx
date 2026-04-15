import React, { useEffect, useState } from 'react';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Button, CircularProgress, MenuItem, IconButton
} from '@mui/material';
import { Summarize, RestartAlt, FileDownload } from '@mui/icons-material';
import API from '../api/API';
import { handleExportToExcel } from '../utils/exportUtils';

const SummaryReport = () => {
    const [reportData, setReportData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);

    const [cities, setCities] = useState([]);
    const [channels, setChannels] = useState([]);
    const [stores, setStores] = useState([]);
    const [users, setUsers] = useState([]);

    const [filters, setFilters] = useState({
        fromDate: format(new Date(), 'yyyy-MM-dd'),
        toDate: format(new Date(), 'yyyy-MM-dd'),
        city_id: '', store_id: '', ba_id: '', channel_id: ''
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
            } catch (err) { console.error(err); }
        };
        fetchInitialData();
    }, []);

    const handleGenerateReport = async () => {
        setLoading(true);
        const cleanFilters = Object.fromEntries(
            Object.entries(filters).filter(([_, v]) => v !== "" && v !== null)
        );
        try {
            const res = await API.get(`/reports/sales-summary-report`, { params: cleanFilters });
            setReportData(res.data.data || []);
            setSummary(res.data.summary || null);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleExcelExport = () => {
        if (!reportData.length) return;
        const excelData = reportData.map(row => {
            const flatRow = {
                'Date': format(parseISO(row.date), 'dd-MM-yyyy'),
                'City': row.city,
                'CH': row.channel,
                'Store': row.storeName,
                'BA': row.baName,
            };
            brands.forEach(brand => {
                flatRow[`${brand} Qty`] = Math.round(row.brands?.[brand]?.qty || 0);
                flatRow[`${brand} Val`] = Math.round(row.brands?.[brand]?.val || 0);
            });
            flatRow['Total Qty'] = Math.round(row.rowTotalQty || 0);
            flatRow['Total Val'] = Math.round(row.rowTotalVal || 0);
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
        flex: 1, minWidth: '150px'
    };

    // Style for header cells
    const headerStyle = {
        bgcolor: '#1b2142',
        color: 'white',
        fontWeight: 800,
        fontSize: '10px',
        p: '4px 6px',
        borderRight: '1px solid #333',
        textAlign: 'center',
        whiteSpace: 'nowrap'
    };

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f1f3f4' }}>

            {/* TOP HEADER */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, px: 2, borderBottom: '1px solid #e0e0e0', flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Summarize sx={{ mr: 1, color: '#ab1d47', fontSize: 22 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1b2142' }}>
                        Sales Summary Report
                    </Typography>
                </Box>

                {summary && (
                    <Paper elevation={0} sx={{ display: 'flex', gap: 3, p: 0.8, px: 2, bgcolor: '#1b2142', color: 'white', borderRadius: 1.5, alignItems: 'center' }}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: '#aaa', display: 'block', fontSize: '0.6rem', lineHeight: 1 }}>TOTAL QTY</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#ffeb3b', fontSize: '0.8rem' }}>{Math.round(summary.grandTotalQty).toLocaleString()}</Typography>
                        </Box>
                        <Box sx={{ width: '1px', bgcolor: '#444', height: '20px' }} />
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: '#aaa', display: 'block', fontSize: '0.6rem', lineHeight: 1 }}>TOTAL VALUE</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#4caf50', fontSize: '0.8rem' }}>Rs. {Math.round(summary.grandTotalVal).toLocaleString()}</Typography>
                        </Box>
                    </Paper>
                )}
            </Box>

            {/* FILTERS SECTION */}
            <Paper variant="outlined" sx={{ m: 1, p: 1, display: 'flex', flexDirection: 'column', gap: 1, borderRadius: '4px' }}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker label="From" value={parseISO(filters.fromDate)} onChange={(v) => setFilters({ ...filters, fromDate: format(v, 'yyyy-MM-dd') })} slotProps={{ textField: { size: 'small', sx: filterFieldStyle } }} />
                        <DatePicker label="To" value={parseISO(filters.toDate)} onChange={(v) => setFilters({ ...filters, toDate: format(v, 'yyyy-MM-dd') })} slotProps={{ textField: { size: 'small', sx: filterFieldStyle } }} />
                    </LocalizationProvider>
                    <TextField select label="City" size="small" value={filters.city_id} onChange={(e) => setFilters({ ...filters, city_id: e.target.value, store_id: '' })} sx={filterFieldStyle}>
                        <MenuItem value="">All Cities</MenuItem>
                        {cities.map(c => <MenuItem key={c.id} value={c.id} sx={{ fontSize: '11px' }}>{c.name}</MenuItem>)}
                    </TextField>
                    <TextField select label="CH" size="small" value={filters.channel_id} onChange={(e) => setFilters({ ...filters, channel_id: e.target.value })} sx={filterFieldStyle}>
                        <MenuItem value="">All</MenuItem>
                        {channels.map(ch => <MenuItem key={ch.id} value={ch.id} sx={{ fontSize: '11px' }}>{ch.name}</MenuItem>)}
                    </TextField>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField select label="Store" size="small" value={filters.store_id} onChange={(e) => setFilters({ ...filters, store_id: e.target.value })} sx={filterFieldStyle}>
                        <MenuItem value="">All Stores</MenuItem>
                        {stores.filter(s => !filters.city_id || String(s.city_id) === String(filters.city_id)).map(s => (
                            <MenuItem key={s.id} value={s.id} sx={{ fontSize: '11px' }}>{s.store_name}</MenuItem>
                        ))}
                    </TextField>
                    <TextField select label="BA" size="small" value={filters.ba_id} onChange={(e) => setFilters({ ...filters, ba_id: e.target.value })} sx={filterFieldStyle}>
                        <MenuItem value="">All BAs</MenuItem>
                        {users.map(u => <MenuItem key={u.id} value={u.id} sx={{ fontSize: '11px' }}>{u.fullname || u.name}</MenuItem>)}
                    </TextField>
                    <Box sx={{ display: 'flex', gap: 0.8, ml: 'auto' }}>
                        <IconButton onClick={resetFilters} size="small" sx={{ border: '1px solid #ccc', borderRadius: '4px', height: '32px', width: '32px' }}><RestartAlt fontSize="small" /></IconButton>
                        <Button variant="contained" onClick={handleGenerateReport} disabled={loading} size="small" sx={{ bgcolor: '#ab1d47', height: '32px', fontWeight: 700, fontSize: '10px' }}>
                            {loading ? <CircularProgress size={14} color="inherit" /> : "GENERATE"}
                        </Button>
                        <Button variant="contained" color="success" onClick={handleExcelExport} disabled={loading || !reportData.length} size="small" sx={{ height: '32px', fontWeight: 700, fontSize: '10px' }}>
                            EXCEL
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* TABLE SECTION */}
            <Box sx={{ flexGrow: 1, px: 1, pb: 1, overflow: 'hidden' }}>
                <TableContainer component={Paper} sx={{ height: '100%', overflow: 'auto', border: '1px solid #e0e0e0' }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                {/* Compact Info Columns */}
                                <TableCell rowSpan={2} sx={{ ...headerStyle, width: '40px' }}>Date</TableCell>
                                <TableCell rowSpan={2} sx={{ ...headerStyle, width: '60px' }}>City</TableCell>
                                <TableCell rowSpan={2} sx={{ ...headerStyle, width: '30px' }}>CH</TableCell>
                                <TableCell rowSpan={2} sx={{ ...headerStyle, width: '30px' }}>Store</TableCell>
                                <TableCell rowSpan={2} sx={{ ...headerStyle, width: '30px' }}>BA</TableCell>

                                {/* Bold Brand Headers */}
                                {brands.map(brand => (
                                    <TableCell key={brand} colSpan={2} align="center" sx={headerStyle}>
                                        {brand}
                                    </TableCell>
                                ))}
                                <TableCell colSpan={2} align="center" sx={{ ...headerStyle, bgcolor: '#004d40' }}>TOTAL</TableCell>
                            </TableRow>
                            <TableRow>
                                {brands.map(brand => (
                                    <React.Fragment key={`${brand}-sub`}>
                                        <TableCell sx={{ ...headerStyle, bgcolor: '#2c345d', fontSize: '9px', width: '25px' }}>Qty</TableCell>
                                        <TableCell sx={{ ...headerStyle, bgcolor: '#2c345d', fontSize: '9px', width: '45px' }}>Val</TableCell>
                                    </React.Fragment>
                                ))}
                                <TableCell sx={{ ...headerStyle, bgcolor: '#005d4f', fontSize: '9px', width: '30px' }}>Qty</TableCell>
                                <TableCell sx={{ ...headerStyle, bgcolor: '#005d4f', fontSize: '9px', width: '50px' }}>Val</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={20} align="center" sx={{ py: 10 }}><CircularProgress /></TableCell></TableRow>
                            ) : reportData.map((row, index) => (
                                <TableRow key={index} hover sx={{ '& td': { fontSize: '10px', p: '4px 6px', whiteSpace: 'nowrap', borderRight: '1px solid #f1f1f1' } }}>
                                    <TableCell sx={{ fontWeight: 600 }}>{row.date ? format(parseISO(row.date), 'dd/MM') : '-'}</TableCell>
                                    <TableCell>{row.city}</TableCell>
                                    <TableCell>{row.channel}</TableCell>
                                    <TableCell sx={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.storeName}</TableCell>
                                    <TableCell>{row.baName}</TableCell>
                                    {brands.map(brand => (
                                        <React.Fragment key={brand}>
                                            <TableCell align="center">{Math.round(row.brands?.[brand]?.qty || 0)}</TableCell>
                                            <TableCell align="right">{Math.round(row.brands?.[brand]?.val || 0).toLocaleString()}</TableCell>
                                        </React.Fragment>
                                    ))}
                                    <TableCell align="center" sx={{ bgcolor: '#f1f8f7', fontWeight: 'bold', color: '#004d40' }}>{Math.round(row.rowTotalQty || 0)}</TableCell>
                                    <TableCell align="right" sx={{ bgcolor: '#f1f8f7', fontWeight: 'bold', color: '#004d40' }}>{Math.round(row.rowTotalVal || 0).toLocaleString()}</TableCell>
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