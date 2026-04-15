import React, { useEffect, useState, useMemo } from 'react';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Button, CircularProgress, MenuItem
} from '@mui/material';
import { Summarize, FileDownload } from '@mui/icons-material';
import API from '../api/API';
import { handleExportToExcel } from '../utils/exportUtils';

const ChannelWiseSummaryReport = () => {
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

    // ✅ UNIFIED HEIGHT: All inputs/pickers same 36px height
    const inputStyle = {
        flex: 1,
        minWidth: '130px',
        '& .MuiInputBase-root': {
            height: '36px',
            fontSize: '12px',
            borderRadius: '4px',
        },
        '& .MuiOutlinedInput-input': {
            padding: '0px 10px',
            height: '36px',
            boxSizing: 'border-box',
            fontSize: '12px',
        },
        '& .MuiInputLabel-root': {
            fontSize: '12px',
            lineHeight: '36px',
            top: '-8px',
        },
        '& .MuiInputLabel-shrink': {
            top: '0px',
            fontSize: '11px',
        },
        '& .MuiSelect-select': {
            padding: '0px 10px !important',
            height: '36px !important',
            display: 'flex',
            alignItems: 'center',
            fontSize: '12px',
        },
        '& .MuiInputAdornment-root .MuiIconButton-root': {
            padding: '4px',
            '& svg': { fontSize: '16px' }
        }
    };

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

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f4f6f8', overflow: 'hidden' }}>

            {/* TOP BAR */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, px: 2, borderBottom: '1px solid #e0e0e0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Summarize sx={{ mr: 1, color: '#ab1d47', fontSize: 20 }} />
                    <Typography sx={{ fontWeight: 'bold', color: '#1b2142', fontSize: '1rem' }}>Channel Sales Report</Typography>
                </Box>
                {summary && (
                    <Paper elevation={0} sx={{ p: '4px 14px', bgcolor: '#1b2142', color: 'white', display: 'flex', gap: 2 }}>
                        <Typography sx={{ fontSize: '0.8rem' }}>Qty: <b>{Math.round(summary.grandTotalQty).toLocaleString()}</b></Typography>
                        <Typography sx={{ fontSize: '0.8rem' }}>Val: <b>{Math.round(summary.grandTotalVal).toLocaleString()}</b></Typography>
                    </Paper>
                )}
            </Box>

            {/* FILTERS */}
            <Paper variant="outlined" sx={{ m: 1, p: 1.5, borderRadius: '4px' }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                            label="From"
                            value={parseISO(filters.fromDate)}
                            onChange={(v) => setFilters({ ...filters, fromDate: format(v, 'yyyy-MM-dd') })}
                            slotProps={{
                                textField: {
                                    size: 'small',
                                    sx: inputStyle
                                }
                            }}
                        />
                        <DatePicker
                            label="To"
                            value={parseISO(filters.toDate)}
                            onChange={(v) => setFilters({ ...filters, toDate: format(v, 'yyyy-MM-dd') })}
                            slotProps={{
                                textField: {
                                    size: 'small',
                                    sx: inputStyle
                                }
                            }}
                        />
                    </LocalizationProvider>

                    <TextField select label="City" size="small" value={filters.city_id}
                        onChange={(e) => setFilters({ ...filters, city_id: e.target.value })}
                        sx={inputStyle}>
                        <MenuItem value="">All Cities</MenuItem>
                        {cities.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                    </TextField>

                    <TextField select label="Channel" size="small" value={filters.channel_id}
                        onChange={(e) => setFilters({ ...filters, channel_id: e.target.value })}
                        sx={inputStyle}>
                        <MenuItem value="">All Channels</MenuItem>
                        {channels.map(ch => <MenuItem key={ch.id} value={ch.id}>{ch.name}</MenuItem>)}
                    </TextField>

                    <TextField select label="Store" size="small" value={filters.store_id}
                        onChange={(e) => setFilters({ ...filters, store_id: e.target.value })}
                        sx={inputStyle}>
                        <MenuItem value="">All Stores</MenuItem>
                        {stores.filter(s => !filters.city_id || String(s.city_id) === String(filters.city_id))
                            .map(s => <MenuItem key={s.id} value={s.id}>{s.store_name}</MenuItem>)}
                    </TextField>

                    <TextField select label="BA" size="small" value={filters.ba_id}
                        onChange={(e) => setFilters({ ...filters, ba_id: e.target.value })}
                        sx={inputStyle}>
                        <MenuItem value="">All BAs</MenuItem>
                        {users.map(u => <MenuItem key={u.id} value={u.id}>{u.fullname || u.name}</MenuItem>)}
                    </TextField>

                    <Button variant="contained" onClick={handleGenerateReport} disabled={loading} size="small"
                        sx={{ bgcolor: '#ab1d47', height: '36px', fontWeight: 'bold', fontSize: '11px', minWidth: '90px', whiteSpace: 'nowrap' }}>
                        GENERATE
                    </Button>
                    <Button variant="contained" color="success" onClick={() => handleExportToExcel(rawReportData, 'Report')} size="small"
                        sx={{ height: '36px', fontWeight: 'bold', fontSize: '11px', minWidth: '80px', whiteSpace: 'nowrap' }}>
                        <FileDownload sx={{ fontSize: '16px', mr: 0.5 }} /> EXCEL
                    </Button>
                </Box>
            </Paper>

            {/* TABLE */}
            <Box sx={{ flexGrow: 1, px: 1, pb: 1, overflow: 'hidden' }}>
                <TableContainer component={Paper} sx={{ height: '100%', overflow: 'auto' }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow sx={{
                                '& th': {
                                    bgcolor: '#1b2142', color: 'white', fontWeight: 'bold',
                                    fontSize: '11px', p: '6px 4px', borderRight: '1px solid #2c345a',
                                    whiteSpace: 'nowrap'
                                }
                            }}>
                                <TableCell colSpan={4} align="center">BASIC INFO</TableCell>
                                {brands.map(b => <TableCell key={b} colSpan={2} align="center">{b}</TableCell>)}
                                <TableCell colSpan={2} align="center" sx={{ bgcolor: '#004d40 !important' }}>TOTAL</TableCell>
                            </TableRow>
                            <TableRow sx={{
                                '& th': {
                                    bgcolor: '#f0f0f0', fontSize: '10px', fontWeight: 'bold',
                                    p: '4px 4px', color: '#1b2142', whiteSpace: 'nowrap'
                                }
                            }}>
                                <TableCell align="center" sx={{ width: '50px' }}>Date</TableCell>
                                <TableCell sx={{ width: '70px' }}>City</TableCell>
                                <TableCell sx={{ width: '130px' }}>Store</TableCell>
                                <TableCell sx={{ width: '110px' }}>BA</TableCell>
                                {brands.concat(["TOTAL"]).map((_, i) => (
                                    <React.Fragment key={i}>
                                        <TableCell align="center" sx={{ width: '40px' }}>Qty</TableCell>
                                        <TableCell align="center" sx={{ width: '65px' }}>Val</TableCell>
                                    </React.Fragment>
                                ))}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={16} align="center" sx={{ py: 10 }}>
                                        <CircularProgress size={30} />
                                    </TableCell>
                                </TableRow>
                            ) : groupedByChannel.map((group, cIdx) => {
                                // ✅ Pre-calculate date groups to avoid rowSpan issues
                                const dateGroups = {};
                                group.allRows.forEach((row, idx) => {
                                    if (!dateGroups[row.rowDate]) dateGroups[row.rowDate] = [];
                                    dateGroups[row.rowDate].push(idx);
                                });

                                return (
                                    <React.Fragment key={cIdx}>
                                        {/* Channel Header Row */}
                                        <TableRow sx={{ bgcolor: '#fff5f7' }}>
                                            <TableCell colSpan={16} sx={{
                                                fontWeight: 'bold', fontSize: '11px',
                                                color: '#ab1d47', py: 0.5, px: 2
                                            }}>
                                                CHANNEL: {group.channelName.toUpperCase()}
                                            </TableCell>
                                        </TableRow>

                                        {/* Data Rows */}
                                        {group.allRows.map((row, rIdx) => {
                                            const isFirstOfDate = dateGroups[row.rowDate]?.[0] === rIdx;
                                            const dateRowSpan = dateGroups[row.rowDate]?.length || 1;

                                            // ✅ Fix NaN: safe number parsing
                                            const totalQty = Number(row.storeTotalQty) || 0;
                                            const totalVal = Number(row.storeTotalVal) || 0;

                                            return (
                                                <TableRow key={rIdx} hover sx={{
                                                    '& td': {
                                                        fontSize: '11px', p: '4px 6px',
                                                        borderRight: '1px solid #f0f0f0'
                                                    }
                                                }}>
                                                    {isFirstOfDate && (
                                                        <TableCell
                                                            rowSpan={dateRowSpan}
                                                            align="center"
                                                            sx={{
                                                                fontWeight: 'bold', bgcolor: '#fff',
                                                                fontSize: '11px', verticalAlign: 'middle',
                                                                borderRight: '1px solid #e0e0e0'
                                                            }}>
                                                            {row.rowDate ? format(parseISO(row.rowDate), 'dd/MM') : '-'}
                                                        </TableCell>
                                                    )}
                                                    <TableCell sx={{ fontSize: '11px' }}>{row.city}</TableCell>
                                                    <TableCell sx={{ fontWeight: 600, fontSize: '11px' }}>
                                                        {row.storeName}
                                                        {row.area && (
                                                            <Box component="span" sx={{
                                                                display: 'block',
                                                                fontSize: '10px',
                                                                color: '#888',
                                                                fontWeight: 400,
                                                                lineHeight: 1.2
                                                            }}>
                                                                {row.area}
                                                            </Box>
                                                        )}
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: '11px' }}>{row.baName}</TableCell>

                                                    {brands.map(b => (
                                                        <React.Fragment key={b}>
                                                            <TableCell align="center">
                                                                {Math.round(Number(row.brands?.[b]?.qty) || 0)}
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                {Math.round(Number(row.brands?.[b]?.val) || 0).toLocaleString()}
                                                            </TableCell>
                                                        </React.Fragment>
                                                    ))}

                                                    {/* ✅ Fixed TOTAL cells - no NaN */}
                                                    <TableCell align="center" sx={{ bgcolor: '#f1f8f7', fontWeight: 'bold', color: '#004d40' }}>
                                                        {Math.round(totalQty)}
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ bgcolor: '#f1f8f7', fontWeight: 'bold', color: '#004d40' }}>
                                                        {Math.round(totalVal).toLocaleString()}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}

                                        {/* ✅ Channel Subtotal Row */}
                                        <TableRow sx={{
                                            bgcolor: '#1b2142',
                                            '& td': { color: 'white', fontWeight: 'bold', fontSize: '11px', py: 0.8 }
                                        }}>
                                            <TableCell colSpan={4} align="right" sx={{ pr: 1 }}>
                                                {group.channelName.toUpperCase()} TOTAL:
                                            </TableCell>
                                            {brands.map(b => (
                                                <React.Fragment key={b}>
                                                    <TableCell align="center">
                                                        {Math.round(group.allRows.reduce((s, r) => s + (Number(r.brands?.[b]?.qty) || 0), 0))}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {Math.round(group.allRows.reduce((s, r) => s + (Number(r.brands?.[b]?.val) || 0), 0)).toLocaleString()}
                                                    </TableCell>
                                                </React.Fragment>
                                            ))}
                                            <TableCell align="center" sx={{ bgcolor: '#004d40' }}>
                                                {Math.round(group.allRows.reduce((s, r) => s + (Number(r.storeTotalQty) || 0), 0))}
                                            </TableCell>
                                            <TableCell align="right" sx={{ bgcolor: '#004d40' }}>
                                                {Math.round(group.allRows.reduce((s, r) => s + (Number(r.storeTotalVal) || 0), 0)).toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Box>
    );
};

export default ChannelWiseSummaryReport;