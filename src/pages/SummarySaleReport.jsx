import React, { useEffect, useState, useMemo } from 'react';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Button, CircularProgress, MenuItem, IconButton, Tooltip
} from '@mui/material';
import { Summarize, RestartAlt, FileDownload } from '@mui/icons-material';
import API from '../api/API';
import { handleExportToExcel } from '../utils/exportUtils';

const SummaryReport = () => {
    const [rawReportData, setRawReportData] = useState([]);
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

    const groupedByChannel = useMemo(() => {
        if (!rawReportData.length) return [];
        const groups = {};
        rawReportData.forEach(item => {
            const chName = item.channel || "Unknown Channel";
            if (!groups[chName]) {
                groups[chName] = { channelName: chName, allRows: [] };
            }
            const storesWithDate = (item.stores || []).map(s => ({ ...s, rowDate: item.date }));
            groups[chName].allRows.push(...storesWithDate);
        });
        return Object.values(groups);
    }, [rawReportData]);

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
        const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ""));
        try {
            const res = await API.get(`/reports/summary-report-by-channels`, { params: cleanFilters });
            setRawReportData(res.data.data || []);
            setSummary(res.data.summary || null);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleExcelExport = () => {
        if (!groupedByChannel.length) return;
        const excelData = [];
        groupedByChannel.forEach(channel => {
            channel.allRows.forEach(row => {
                const flatRow = {
                    'Date': format(parseISO(row.rowDate), 'dd-MM-yyyy'),
                    'City': row.city || '-',
                    'Channel': channel.channelName,
                    'Store': `${row.storeName} (${row.area || '-'})`,
                    'BA Name': row.baName || '-',
                };
                brands.forEach(b => {
                    flatRow[`${b} Qty`] = Math.round(row.brands?.[b]?.qty || 0);
                    flatRow[`${b} Val`] = Math.round(row.brands?.[b]?.val || 0);
                });
                flatRow['Grand Total Qty'] = Math.round(row.storeTotalQty || 0);
                flatRow['Grand Total Val'] = Math.round(row.storeTotalVal || 0);
                excelData.push(flatRow);
            });
        });
        handleExportToExcel(excelData, `Sales_Summary_${filters.fromDate}_to_${filters.toDate}`);
    };

    const filterFieldStyle = {
        '& .MuiInputBase-root': { height: '32px', fontSize: '12px' },
        '& .MuiInputLabel-root': { fontSize: '11px', transform: 'translate(10px, 8px) scale(1)' },
        '& .MuiInputLabel-shrink': { transform: 'translate(10px, -8px) scale(0.75)' },
        flex: 1, minWidth: '160px'
    };

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f1f3f4' }}>

            {/* ORIGINAL HEADER DESIGN */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, px: 2, borderBottom: '1px solid #e0e0e0', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Summarize sx={{ mr: 1, color: '#ab1d47', fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1b2142', fontSize: '1.1rem' }}>
                        Sales Summary Report
                    </Typography>
                </Box>
                {summary && (
                    <Paper elevation={0} sx={{ display: 'flex', gap: 4, p: 1.2, px: 3, bgcolor: '#1b2142', color: 'white', borderRadius: 2, alignItems: 'center' }}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: '#aaa', display: 'block', fontSize: '0.65rem' }}>Total Qty</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#ffeb3b' }}>{Math.round(summary.grandTotalQty).toLocaleString()}</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: '#aaa', display: 'block', fontSize: '0.65rem' }}>Total Value</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#4caf50' }}>Rs. {Math.round(summary.grandTotalVal).toLocaleString()}</Typography>
                        </Box>
                    </Paper>
                )}
            </Box>

            {/* FILTERS SECTION */}
            <Paper variant="outlined" sx={{ m: 1, p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, borderRadius: '4px' }}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker label="From" value={parseISO(filters.fromDate)} onChange={(v) => setFilters({ ...filters, fromDate: format(v, 'yyyy-MM-dd') })} slotProps={{ textField: { size: 'small', sx: filterFieldStyle } }} />
                        <DatePicker label="To" value={parseISO(filters.toDate)} onChange={(v) => setFilters({ ...filters, toDate: format(v, 'yyyy-MM-dd') })} slotProps={{ textField: { size: 'small', sx: filterFieldStyle } }} />
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
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField select label="Store" size="small" value={filters.store_id} onChange={(e) => setFilters({ ...filters, store_id: e.target.value })} sx={filterFieldStyle}>
                        <MenuItem value="">All Stores</MenuItem>
                        {stores.filter(s => !filters.city_id || String(s.city_id) === String(filters.city_id)).map(s => (
                            <MenuItem key={s.id} value={s.id} sx={{ fontSize: '12px' }}>{s.store_name}</MenuItem>
                        ))}
                    </TextField>
                    <TextField select label="BA (User)" size="small" value={filters.ba_id} onChange={(e) => setFilters({ ...filters, ba_id: e.target.value })} sx={filterFieldStyle}>
                        <MenuItem value="">All BAs</MenuItem>
                        {users.map(u => <MenuItem key={u.id} value={u.id} sx={{ fontSize: '12px' }}>{u.fullname || u.name}</MenuItem>)}
                    </TextField>
                    <Box sx={{ display: 'flex', gap: 0.8, ml: 'auto' }}>
                        <Button variant="contained" onClick={handleGenerateReport} disabled={loading} size="small" sx={{ bgcolor: '#ab1d47', height: '32px', minWidth: '120px', fontWeight: 700, fontSize: '11px' }}>
                            {loading ? <CircularProgress size={16} color="inherit" /> : "GENERATE"}
                        </Button>
                        <Button variant="contained" color="success" onClick={handleExcelExport} size="small" sx={{ height: '32px', minWidth: '100px', fontWeight: 700, fontSize: '11px' }}>
                            <FileDownload sx={{ fontSize: 16, mr: 0.5 }} /> EXCEL
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* TABLE AREA - DESIGN RESTORED */}
            <Box sx={{ flexGrow: 1, px: 1, pb: 1, overflow: 'hidden' }}>
                <TableContainer component={Paper} sx={{ height: '100%', overflow: 'auto', border: '1px solid #e0e0e0' }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow sx={{ '& th': { bgcolor: '#1b2142', color: 'white', fontWeight: 800, fontSize: '10px' } }}>
                                {/* colSpan=4 for Date, City, Store(Area), BA */}
                                <TableCell colSpan={4} align="center">BASIC INFO</TableCell>
                                {brands.map(b => <TableCell key={b} colSpan={2} align="center" sx={{ borderLeft: '1px solid #444' }}>{b}</TableCell>)}
                                <TableCell colSpan={2} align="center" sx={{ bgcolor: '#004d40' }}>OVERALL TOTAL</TableCell>
                            </TableRow>
                            <TableRow sx={{ '& th': { bgcolor: '#f8f9fa', fontSize: '9px', fontWeight: 'bold' } }}>
                                <TableCell align="center">Date</TableCell>
                                <TableCell>City</TableCell>
                                <TableCell>Store</TableCell>
                                <TableCell>BA</TableCell>
                                {brands.concat("GRAND").map((_, i) => (
                                    <React.Fragment key={i}><TableCell align="center">Q</TableCell><TableCell align="center">V</TableCell></React.Fragment>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={25} align="center" sx={{ py: 10 }}><CircularProgress size={30} /></TableCell></TableRow>
                            ) : groupedByChannel.map((channelGroup, cIdx) => (
                                <React.Fragment key={cIdx}>

                                    {/* CHANNEL HEADER */}
                                    <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                                        <TableCell colSpan={25} sx={{ fontWeight: 'bold', fontSize: '12px', color: '#ab1d47', py: 1, borderBottom: '2px solid #ab1d47' }}>
                                            CHANNEL: {channelGroup.channelName.toUpperCase()}
                                        </TableCell>
                                    </TableRow>

                                    {channelGroup.allRows.map((row, rIdx) => (
                                        <TableRow key={`${cIdx}-${rIdx}`} hover sx={{ '& td': { fontSize: '10px', p: '4px 8px', borderRight: '1px solid #f1f1f1' } }}>

                                            {/* DATE: CENTERED IN ROWSPAN */}
                                            {(rIdx === 0 || row.rowDate !== channelGroup.allRows[rIdx - 1].rowDate) ? (
                                                <TableCell
                                                    rowSpan={channelGroup.allRows.filter(x => x.rowDate === row.rowDate).length}
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        bgcolor: '#fff',
                                                        textAlign: 'center',
                                                        verticalAlign: 'middle',
                                                        borderRight: '1px solid #e0e0e0'
                                                    }}
                                                >
                                                    {row.rowDate ? format(parseISO(row.rowDate), 'dd/MM') : '-'}
                                                </TableCell>
                                            ) : null}

                                            <TableCell>{row.city || '-'}</TableCell>

                                            {/* STORE & AREA MERGED */}
                                            <TableCell>
                                                <Box sx={{ fontWeight: 600 }}>{row.storeName || '-'}</Box>
                                                <Box sx={{ fontSize: '9px', color: '#666' }}>{row.area || 'N/A'}</Box>
                                            </TableCell>

                                            <TableCell>{row.baName || '-'}</TableCell>

                                            {brands.map(b => (
                                                <React.Fragment key={b}>
                                                    <TableCell align="center">{Math.round(row.brands?.[b]?.qty || 0)}</TableCell>
                                                    <TableCell align="right">{Math.round(row.brands?.[b]?.val || 0).toLocaleString()}</TableCell>
                                                </React.Fragment>
                                            ))}

                                            <TableCell align="center" sx={{ bgcolor: '#f1f8f7', fontWeight: 'bold', color: '#004d40' }}>
                                                {Math.round(row.storeTotalQty || 0)}
                                            </TableCell>
                                            <TableCell align="right" sx={{ bgcolor: '#f1f8f7', fontWeight: 'bold', color: '#004d40' }}>
                                                {Math.round(row.storeTotalVal || 0).toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {/* SUB-TOTAL DESIGN RESTORED */}
                                    <TableRow sx={{ bgcolor: '#1b2142', '& td': { fontWeight: 'bold', fontSize: '11px', color: 'white' } }}>
                                        <TableCell colSpan={4} align="right">
                                            {channelGroup.channelName.toUpperCase()} TOTAL:
                                        </TableCell>
                                        {brands.map(b => (
                                            <React.Fragment key={b}>
                                                <TableCell align="center">{Math.round(channelGroup.allRows.reduce((sum, r) => sum + (r.brands?.[b]?.qty || 0), 0))}</TableCell>
                                                <TableCell align="right">{Math.round(channelGroup.allRows.reduce((sum, r) => sum + (r.brands?.[b]?.val || 0), 0)).toLocaleString()}</TableCell>
                                            </React.Fragment>
                                        ))}
                                        <TableCell align="center" sx={{ bgcolor: '#004d40' }}>
                                            {Math.round(channelGroup.allRows.reduce((sum, r) => sum + (r.storeTotalQty || 0), 0))}
                                        </TableCell>
                                        <TableCell align="right" sx={{ bgcolor: '#004d40' }}>
                                            {Math.round(channelGroup.allRows.reduce((sum, r) => sum + (parseFloat(r.storeTotalVal) || 0), 0)).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Box>
    );
};

export default SummaryReport;