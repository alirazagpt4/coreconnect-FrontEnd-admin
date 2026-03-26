import React, { useEffect, useState } from 'react';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Button, CircularProgress, MenuItem
} from '@mui/material';
import { Summarize, Search, FileDownload } from '@mui/icons-material';
import API from '../api/API';
import { handleExportToExcel } from '../utils/exportUtils';

const SummaryReport = () => {
    const [reportData, setReportData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [cities, setCities] = useState([]);
    const [stores, setStores] = useState([]);
    const [users, setUsers] = useState([]);

    const [filters, setFilters] = useState({
        fromDate: format(new Date(), 'yyyy-MM-dd'),
        toDate: format(new Date(), 'yyyy-MM-dd'),
        city_id: '', store_id: '', ba_id: ''
    });

    const brands = ["AMRIJ", "EVERNOYA", "NO!MO!", "RHD", "RIVAJ"];

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [c, s, u] = await Promise.all([
                    API.get('/cities'),
                    API.get('/store?limit=1000'),
                    API.get('/users?limit=1000')
                ]);
                setCities(c.data);
                setStores(s.data.stores || []);
                setUsers(u.data.users.filter(user => user.designation?.name === "BA"));
            } catch (err) { console.error("Initial Fetch Error", err); }
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
        handleExportToExcel(excelData, `Sales_Summary_${filters.fromDate}`);
    };

    const filterFieldStyle = {
        '& .MuiInputBase-root': { height: '32px', fontSize: '12px' },
        '& .MuiInputLabel-root': { fontSize: '11px', transform: 'translate(10px, 8px) scale(1)' },
        '& .MuiInputLabel-shrink': { transform: 'translate(10px, -8px) scale(0.75)' },
        flex: 1, minWidth: '140px'
    };

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f1f3f4' }}>

            {/* Header / Summary Info */}
            <Paper elevation={1} sx={{ p: 1, px: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 0, bgcolor: '#fff' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Summarize sx={{ color: '#ab1d47', fontSize: 20 }} />
                    <Typography sx={{ fontWeight: 800, fontSize: '14px' }}>SALES SUMMARY REPORT</Typography>
                </Box>
                {summary && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Box sx={{ bgcolor: '#1b2142', color: 'white', px: 1.5, py: 0.2, borderRadius: 1 }}>
                            <Typography sx={{ fontSize: '11px' }}>
                                Qty: <b>{Math.round(summary.grandTotalQty)}</b> |
                                Val: <b>{Math.round(summary.grandTotalVal).toLocaleString()}</b>
                            </Typography>
                        </Box>
                    </Box>
                )}
            </Paper>

            {/* Compact Filters - All Here Now */}
            <Paper variant="outlined" sx={{ m: 1, p: 1, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', borderRadius: '4px' }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker label="From" value={parseISO(filters.fromDate)} onChange={(v) => setFilters({ ...filters, fromDate: format(v, 'yyyy-MM-dd') })} slotProps={{ textField: { size: 'small', sx: filterFieldStyle } }} />
                    <DatePicker label="To" value={parseISO(filters.toDate)} onChange={(v) => setFilters({ ...filters, toDate: format(v, 'yyyy-MM-dd') })} slotProps={{ textField: { size: 'small', sx: filterFieldStyle } }} />
                </LocalizationProvider>

                <TextField select label="City" size="small" value={filters.city_id} onChange={(e) => setFilters({ ...filters, city_id: e.target.value })} sx={filterFieldStyle}>
                    <MenuItem value="">All Cities</MenuItem>
                    {cities.map(c => <MenuItem key={c.id} value={c.id} sx={{ fontSize: '12px' }}>{c.name}</MenuItem>)}
                </TextField>

                <TextField select label="Store" size="small" value={filters.store_id} onChange={(e) => setFilters({ ...filters, store_id: e.target.value })} sx={filterFieldStyle}>
                    <MenuItem value="">All Stores</MenuItem>
                    {stores.map(s => <MenuItem key={s.id} value={s.id} sx={{ fontSize: '12px' }}>{s.store_name}</MenuItem>)}
                </TextField>

                <TextField select label="BA" size="small" value={filters.ba_id} onChange={(e) => setFilters({ ...filters, ba_id: e.target.value })} sx={filterFieldStyle}>
                    <MenuItem value="">All BAs</MenuItem>
                    {users.map(u => <MenuItem key={u.id} value={u.id} sx={{ fontSize: '12px' }}>{u.fullname || u.name}</MenuItem>)}
                </TextField>

                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Button variant="contained" onClick={handleGenerateReport} size="small" sx={{ bgcolor: '#1b2142', height: '32px' }}>
                        <Search sx={{ fontSize: 16, mr: 0.5 }} /> FETCH
                    </Button>
                    <Button variant="contained" color="success" onClick={handleExcelExport} size="small" sx={{ height: '32px' }}>
                        <FileDownload sx={{ fontSize: 16, mr: 0.5 }} /> EXCEL
                    </Button>
                </Box>
            </Paper>

            {/* Table Area */}
            <Box sx={{ flexGrow: 1, px: 1, pb: 1, overflow: 'hidden' }}>
                <TableContainer component={Paper} sx={{ height: '100%', overflow: 'auto', borderRadius: '4px' }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow sx={{ '& th': { bgcolor: '#1b2142', color: 'white', fontWeight: 800, fontSize: '10px', py: 0.5, borderRight: '1px solid #333' } }}>
                                <TableCell colSpan={5} align="center">BASIC INFO</TableCell>
                                {brands.map(b => <TableCell key={b} colSpan={2} align="center">{b}</TableCell>)}
                                <TableCell colSpan={2} align="center" sx={{ bgcolor: '#004d40' }}>TOTAL</TableCell>
                            </TableRow>
                            <TableRow sx={{ '& th': { bgcolor: '#f8f9fa', fontSize: '9px', fontWeight: 'bold', p: '4px' } }}>
                                {["Date", "City", "CH", "Store", "BA"].map(h => <TableCell key={h}>{h}</TableCell>)}
                                {[...brands, "OVERALL"].map((_, i) => (
                                    <React.Fragment key={i}>
                                        <TableCell align="center" sx={{ borderLeft: '1px solid #eee' }}>Q</TableCell>
                                        <TableCell align="center">V</TableCell>
                                    </React.Fragment>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={20} align="center" sx={{ py: 10 }}><CircularProgress size={25} /></TableCell></TableRow>
                            ) : reportData.map((row, idx) => (
                                <TableRow key={idx} hover sx={{ '& td': { fontSize: '10.5px', p: '4px 8px', borderRight: '1px solid #f1f1f1', whiteSpace: 'nowrap' } }}>
                                    <TableCell>{format(parseISO(row.date), 'dd/MM')}</TableCell>
                                    <TableCell>{row.city}</TableCell>
                                    <TableCell>{row.channel}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{row.storeName}</TableCell>
                                    <TableCell>{row.baName}</TableCell>
                                    {brands.map(b => (
                                        <React.Fragment key={b}>
                                            <TableCell align="center">{Math.round(row.brands[b]?.qty || 0)}</TableCell>
                                            <TableCell align="right">{Math.round(row.brands[b]?.val || 0).toLocaleString()}</TableCell>
                                        </React.Fragment>
                                    ))}
                                    {/* Grand Totals at the end of the row */}
                                    <TableCell align="center" sx={{ bgcolor: '#f1f8f7', fontWeight: 'bold' }}>
                                        {Math.round(row.rowTotalQty)}
                                    </TableCell>
                                    <TableCell align="right" sx={{ bgcolor: '#f1f8f7', fontWeight: 'bold' }}>
                                        {Math.round(row.rowTotalVal).toLocaleString()}
                                    </TableCell>                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Box>
    );
};

export default SummaryReport;