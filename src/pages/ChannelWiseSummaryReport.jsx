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
    const [areas, setAreas] = useState([]);

    const [filters, setFilters] = useState({
        fromDate: format(new Date(), 'yyyy-MM-dd'),
        toDate: format(new Date(), 'yyyy-MM-dd'),
        city_id: '', store_id: '', area: '', channel_id: ''
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
                const [c, s, u, ch, a] = await Promise.all([
                    API.get('/cities'),
                    API.get('/store?limit=1000'),
                    API.get('/users?limit=1000'),
                    API.get('/channels/getchannels'),
                    API.get('/store/areas')
                ]);
                setCities(c.data);
                setStores(s.data.stores || []);
                setUsers(u.data.users.filter(user => user.designation?.name === "BA"));
                setChannels(ch.data || []);
                console.log("areasssss : ", a.data.areas)
                setAreas(a.data.areas || []);
            } catch (err) { console.error(err); }
        };
        fetchInitialData();
    }, []);




    const getFormattedDataForExcel = () => {
        let excelRows = [];

        groupedByChannel.forEach((group) => {
            // 1. Channel Header Row
            const headerRow = {
                "DATE": `CHANNEL: ${group.channelName.toUpperCase()}`,
                "CITY": "",
                "STORE": "",
                "AREA": "", // ✅ Area column specifically added
                "BA": "",
            };
            brands.forEach(b => {
                headerRow[`${b} QTY`] = "";
                headerRow[`${b} VAL`] = "";
            });
            headerRow["TOTAL QTY"] = "";
            headerRow["TOTAL VAL"] = "";
            excelRows.push(headerRow);

            // 2. Main Data Rows
            group.allRows.forEach((row) => {
                const dataRow = {
                    "DATE": row.rowDate || '-',
                    "CITY": row.city || '',
                    "STORE": row.storeName || '',
                    "AREA": row.area || '', // ✅ Sequence set: Store ke baad Area
                    "BA": row.baName || '',  // ✅ Area ke baad BA
                };

                // Dynamic Brand Columns
                brands.forEach(b => {
                    dataRow[`${b} QTY`] = Math.round(row.brands?.[b]?.qty || 0);
                    dataRow[`${b} VAL`] = Math.round(row.brands?.[b]?.val || 0);
                });

                dataRow["TOTAL QTY"] = Math.round(row.storeTotalQty || 0);
                dataRow["TOTAL VAL"] = Math.round(row.storeTotalVal || 0);

                excelRows.push(dataRow);
            });

            // 3. Subtotal Row
            const subTotalRow = {
                "DATE": "", "CITY": "", "STORE": "", "AREA": "",
                "BA": `${group.channelName.toUpperCase()} TOTAL:`,
            };

            brands.forEach(b => {
                subTotalRow[`${b} QTY`] = Math.round(group.allRows.reduce((s, r) => s + (Number(r.brands?.[b]?.qty) || 0), 0));
                subTotalRow[`${b} VAL`] = Math.round(group.allRows.reduce((s, r) => s + (Number(r.brands?.[b]?.val) || 0), 0));
            });

            subTotalRow["TOTAL QTY"] = Math.round(group.allRows.reduce((s, r) => s + (Number(r.storeTotalQty) || 0), 0));
            subTotalRow["TOTAL VAL"] = Math.round(group.allRows.reduce((s, r) => s + (Number(r.storeTotalVal) || 0), 0));

            excelRows.push(subTotalRow);
        });

        return excelRows;
    };


    const handleGenerateReport = async () => {
        setLoading(true);
        try {
            // Encode each filter value to handle spaces and special chars like "NO!MO!"
            const encodedFilters = {};
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    encodedFilters[key] = encodeURIComponent(filters[key]);
                }
            });

            // Axios typically does this, but manual encoding ensures 100% safety
            const res = await API.get(`/reports/summary-report-by-channels`, {
                params: encodedFilters
            });

            setRawReportData(res.data.data || []);
            setSummary(res.data.summary || null);
        } catch (err) {
            console.error("Report Error:", err);
        } finally {
            setLoading(false);
        }
    };

    // --- UPDATED FILTERED STORES LOGIC (STRICT ACTIVE STORES ONLY) ---
    const filteredStores = stores.filter(store => {
        // 1. Strict Active Status Check (Only allow true or numeric 1)
        const isActive = store.is_active === true || store.is_active === 1;
        if (!isActive) return false; // Inactive stores यहीं se drop ho jayenge

        // 2. Channel Filter Check
        const matchesChannel = filters.channel_id
            ? store.channel_id === filters.channel_id
            : true;

        // 3. Single City Filter Check
        const matchesCity = filters.city_id && filters.city_id !== ""
            ? store.city_id === filters.city_id
            : true;

        return matchesChannel && matchesCity;
    });

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

                    <TextField
                        select
                        label="City"
                        size="small"
                        value={filters.city_id}
                        sx={inputStyle}
                        // Updated Single Select onChange Logic
                        onChange={(e) => setFilters({
                            ...filters,
                            city_id: e.target.value,
                            store_id: "", // City badalte hi store reset
                            area: ""      // Store reset toh area bhi automatic reset
                        })}
                    >
                        <MenuItem value="">All Cities</MenuItem>
                        {cities.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                    </TextField>

                    <TextField
                        select
                        label="Channel"
                        size="small"
                        value={filters.channel_id}
                        sx={inputStyle}
                        // Is onChange ko replace karo:
                        onChange={(e) => setFilters({ ...filters, channel_id: e.target.value, store_id: "" })}
                    >
                        <MenuItem value="">All Channels</MenuItem>
                        {channels.map(ch => <MenuItem key={ch.id} value={ch.id}>{ch.name}</MenuItem>)}
                    </TextField>

                    <TextField
                        select
                        label="Store"
                        size="small"
                        value={filters.store_id}
                        sx={inputStyle}
                        onChange={(e) => {
                            const selectedStoreId = e.target.value;
                            // Poori stores list mein se select kiya hua store dhundo
                            const selectedStoreObj = stores.find(s => s.id === selectedStoreId);

                            setFilters({
                                ...filters,
                                store_id: selectedStoreId,
                                // Agar store mil jaye toh uska area auto-select karo, warna khali ""
                                area: selectedStoreObj ? selectedStoreObj.area : ""
                            });
                        }}
                    >
                        <MenuItem value="">All Stores</MenuItem>
                        {/* Yahan humne filteredStores use kiya hai jo top par compute ho raha hai */}
                        {filteredStores.map(s => <MenuItem key={s.id} value={s.id}>{s.store_name}({s.area})</MenuItem>)}
                    </TextField>

                    <TextField
                        select
                        label="Area"
                        size="small"
                        value={filters.area}
                        sx={inputStyle}
                        onChange={(e) => setFilters({ ...filters, area: e.target.value })}
                        // Jab store select ho jaye, toh area ko disable kar do taake user conflicts paida na kare
                        disabled={!!filters.store_id}
                    >
                        <MenuItem value="">All Areas</MenuItem>
                        {areas.map((a, i) => <MenuItem key={i} value={a}>{a}</MenuItem>)}
                    </TextField>

                    <Button variant="contained" onClick={handleGenerateReport} disabled={loading} size="small"
                        sx={{ bgcolor: '#ab1d47', height: '36px', fontWeight: 'bold', fontSize: '11px', minWidth: '90px', whiteSpace: 'nowrap' }}>
                        GENERATE
                    </Button>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={() => handleExportToExcel(getFormattedDataForExcel(), 'Channel_Sales_Report')}
                        size="small"
                        sx={{ height: '36px', fontWeight: 'bold', fontSize: '11px', minWidth: '80px', whiteSpace: 'nowrap' }}
                    >
                        <FileDownload sx={{ fontSize: '16px', mr: 0.5 }} /> EXCEL
                    </Button>
                </Box>
            </Paper>

            {/* TABLE */}
            <Box sx={{ flexGrow: 1, px: 0.5, pb: 1, height: 'calc(100vh - 160px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <TableContainer component={Paper} sx={{ flexGrow: 1, overflow: 'auto', boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                    <Table stickyHeader size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                        <TableHead>
                            {/* Top Header - Pure Live Portal Style */}
                            <TableRow sx={{ '& th': { bgcolor: '#1b2142', color: 'white', fontWeight: 'bold', fontSize: '10px', p: '4px 2px', borderRight: '1px solid #2c345a' } }}>
                                <TableCell colSpan={5} align="center">Store Details</TableCell>
                                {brands.map(b => <TableCell key={b} colSpan={2} align="center">{b.toUpperCase()}</TableCell>)}
                                <TableCell colSpan={2} align="center" sx={{ bgcolor: '#004d40 !important' }}>TOTAL</TableCell>
                            </TableRow>
                            {/* Sub Header - Adjusted for Area */}
                            <TableRow sx={{ '& th': { bgcolor: '#f5f5f5', fontSize: '9px', fontWeight: 'bold', p: '2px 2px', color: '#1b2142', borderRight: '1px solid #e0e0e0' } }}>
                                <TableCell align="center" sx={{ width: '45px' }}>Date</TableCell>
                                <TableCell sx={{ width: '55px' }}>City</TableCell>
                                <TableCell sx={{ width: '110px' }}>Store</TableCell> {/* Slightly tight to keep it 1 line */}
                                <TableCell sx={{ width: '85px' }}>Area</TableCell>  {/* Added Area */}
                                <TableCell sx={{ width: '85px' }}>BA</TableCell>
                                {brands.concat(["TOTAL"]).map((_, i) => (
                                    <React.Fragment key={i}>
                                        <TableCell align="center" sx={{ width: '35px' }}>Qty</TableCell>
                                        <TableCell align="center" sx={{ width: '50px' }}>Val</TableCell>
                                    </React.Fragment>
                                ))}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {!loading && groupedByChannel.map((group, cIdx) => {
                                const dateGroups = {};
                                group.allRows.forEach((row, idx) => {
                                    if (!dateGroups[row.rowDate]) dateGroups[row.rowDate] = [];
                                    dateGroups[row.rowDate].push(idx);
                                });

                                return (
                                    <React.Fragment key={cIdx}>
                                        <TableRow sx={{ bgcolor: '#fff5f7' }}>
                                            <TableCell colSpan={5 + (brands.length * 2) + 2} sx={{ fontWeight: 'bold', fontSize: '10px', color: '#ab1d47', py: 0.3, px: 1 }}>
                                                CHANNEL: {group.channelName.toUpperCase()}
                                            </TableCell>
                                        </TableRow>

                                        {group.allRows.map((row, rIdx) => {
                                            const isFirstOfDate = dateGroups[row.rowDate]?.[0] === rIdx;
                                            return (
                                                <TableRow key={rIdx} hover sx={{
                                                    '& td': {
                                                        fontSize: '10px', p: '2px 4px',
                                                        borderRight: '1px solid #f0f0f0',
                                                        whiteSpace: 'normal', // Isse naam lamba hua toh niche chala jayega
                                                        wordBreak: 'break-word',
                                                        lineHeight: '1.1'
                                                    }
                                                }}>
                                                    {isFirstOfDate && (
                                                        <TableCell rowSpan={dateGroups[row.rowDate].length} align="center" sx={{ fontWeight: 'bold', bgcolor: '#fff', verticalAlign: 'middle' }}>
                                                            {row.rowDate ? format(parseISO(row.rowDate), 'MMM dd') : '-'}
                                                        </TableCell>
                                                    )}
                                                    <TableCell>{row.city}</TableCell>
                                                    {/* Store Name with optional wrap */}
                                                    <TableCell sx={{ fontWeight: 600 }}>{row.storeName}</TableCell>
                                                    <TableCell>{row.area}</TableCell>
                                                    <TableCell>{row.baName}</TableCell>

                                                    {brands.map(b => (
                                                        <React.Fragment key={b}>
                                                            <TableCell align="center">{Math.round(Number(row.brands?.[b]?.qty) || 0)}</TableCell>
                                                            <TableCell align="right">{Math.round(Number(row.brands?.[b]?.val) || 0).toLocaleString()}</TableCell>
                                                        </React.Fragment>
                                                    ))}
                                                    <TableCell align="center" sx={{ bgcolor: '#f1f8f7', fontWeight: 'bold', color: '#004d40' }}>{Math.round(Number(row.storeTotalQty) || 0)}</TableCell>
                                                    <TableCell align="right" sx={{ bgcolor: '#f1f8f7', fontWeight: 'bold', color: '#004d40' }}>{Math.round(Number(row.storeTotalVal) || 0).toLocaleString()}</TableCell>
                                                </TableRow>
                                            );
                                        })}

                                        {/* Sub-Total Row - Live Portal Style */}
                                        <TableRow sx={{ bgcolor: '#1b2142', '& td': { color: 'white', fontWeight: 'bold', fontSize: '10px', py: 0.5 } }}>
                                            <TableCell colSpan={5} align="right" sx={{ pr: 1 }}>{group.channelName.toUpperCase()} TOTAL:</TableCell>
                                            {brands.map(b => (
                                                <React.Fragment key={b}>
                                                    <TableCell align="center">{Math.round(group.allRows.reduce((s, r) => s + (Number(r.brands?.[b]?.qty) || 0), 0))}</TableCell>
                                                    <TableCell align="right">{Math.round(group.allRows.reduce((s, r) => s + (Number(r.brands?.[b]?.val) || 0), 0)).toLocaleString()}</TableCell>
                                                </React.Fragment>
                                            ))}
                                            <TableCell align="center" sx={{ bgcolor: '#004d40' }}>{Math.round(group.allRows.reduce((s, r) => s + (Number(r.storeTotalQty) || 0), 0))}</TableCell>
                                            <TableCell align="right" sx={{ bgcolor: '#004d40' }}>{Math.round(group.allRows.reduce((s, r) => s + (Number(r.storeTotalVal) || 0), 0)).toLocaleString()}</TableCell>
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