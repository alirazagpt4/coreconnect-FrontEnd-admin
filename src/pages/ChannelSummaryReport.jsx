import React, { useEffect, useState } from 'react';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Button, MenuItem, Divider, Checkbox, ListItemText
} from '@mui/material';
import { Summarize, FileDownload, Map, CalendarToday, Store as StoreIcon, LocationOn } from '@mui/icons-material'; // Icons add kiye
import API from '../api/API';
import { handleExportToExcelWithFilters } from '../utils/exportUtils';

const ChannelSummaryReport = () => {
    const [rawReportData, setRawReportData] = useState([]);
    // Header state ko update kiya taake backend ke saare fields handle hon
    const [reportHeader, setReportHeader] = useState({ city: '', period: '', store: '', area: '', channel: '' });
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [cities, setCities] = useState([]);
    const [channels, setChannels] = useState([]);
    const [areas, setAreas] = useState([]);
    const [stores, setStores] = useState([]); // Stores ki list ke liye

    const [filters, setFilters] = useState({
        fromDate: format(new Date(), 'yyyy-MM-dd'),
        toDate: format(new Date(), 'yyyy-MM-dd'),
        city_id: [], // Multi-select ke liye array
        store_id: '',
        area: '',
        channel_id: ''
    });


    const brands = ["AMRIJ", "EVERNOYA", "NO!MO!", "RHD", "RIVAJ"];
    const inputStyle = {
        flex: 1,
        minWidth: '150px', // Width thori barha di taake lambi date fit aaye
        '& .MuiInputBase-root': {
            height: '42px', // Height 36px se barha kar 42px kar di
            fontSize: '13px',
            borderRadius: '4px'
        },
        '& .MuiOutlinedInput-input': {
            padding: '8px 12px', // Padding behtar ki taake text center mein rahe
            display: 'flex',
            alignItems: 'center',
            boxSizing: 'border-box',
        },
        '& .MuiInputLabel-root': {
            fontSize: '13px',
            top: '0px' // Label ki position adjust ki
        },
        '& .MuiInputLabel-shrink': {
            top: '0px',
            fontSize: '12px'
        }
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [c, s, ch, a] = await Promise.all([
                    API.get('/cities'),
                    API.get('/store?limit=1000'),
                    API.get('/channels/getchannels'),
                    API.get('/store/areas')

                ]);
                setCities(c.data);
                setChannels(ch.data || []);
                setAreas(a.data.areas || []);
                setStores(s.data.stores || []);
                console.log("stores", s.data)
            } catch (err) { console.error(err); }
        };
        fetchInitialData();
    }, []);

    const handleGenerateReport = async () => {
        setLoading(true);
        try {
            // Confirming filters before sending
            const params = {
                fromDate: filters.fromDate,
                toDate: filters.toDate,
                city_id: Array.isArray(filters.city_id) ? filters.city_id.join(',') : filters.city_id,
                channel_id: filters.channel_id,
                store_id: filters.store_id,
                // .trim() use karo taake extra space backend par masla na kare
                area: filters.area ? filters.area.trim() : ''
            };

            console.log("Sending Params to Backend:", params); // Console check lazmi karein

            const res = await API.get(`/reports/summary-flatten`, { params });

            if (res.data.success) {
                setRawReportData(res.data.data || []);
                setSummary(res.data.summary || null);
                setReportHeader(res.data.header);
            }
        } catch (err) {
            console.error("Report Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const getFormattedDataForExcel = () => {
        let excelRows = [];

        // Columns ka order fix kar letay hain taake mismatch na ho
        const brandColumns = ["AMRIJ", "EVERNOYA", "NO!MO!", "RHD", "RIVAJ"];

        rawReportData.forEach((group) => {
            // 1. Channel Header Row
            excelRows.push({
                "STORE": `${group.channel.toUpperCase()}`,
                "AREA": "",
                ...brandColumns.reduce((acc, b) => ({ ...acc, [`${b} QTY`]: "", [`${b} VALUE`]: "" }), {}),
                "TOTAL QTY": "",
                "TOTAL VALUE": ""
            });

            // 2. Store Data Rows
            group.stores.forEach(s => {
                const row = {
                    "STORE": s.storeName,
                    "AREA": s.area
                };

                // Har brand ka data specific column mein map karein
                brandColumns.forEach(b => {
                    row[`${b} QTY`] = s.brands[b]?.qty || 0;
                    row[`${b} VALUE`] = Math.round(s.brands[b]?.val || 0);
                });

                row["TOTAL QTY"] = s.storeTotalQty;
                row["TOTAL VALUE"] = Math.round(s.storeTotalVal);

                excelRows.push(row);
            });

            // 3. Channel Total Row (Optional: Excel mein readability behtar karta hai)
            const channelTotalRow = {
                "STORE": `${group.channel.toUpperCase()} TOTAL`,
                "AREA": "",
            };
            brandColumns.forEach(b => {
                const qty = group.stores.reduce((sum, st) => sum + (st.brands[b]?.qty || 0), 0);
                const val = group.stores.reduce((sum, st) => sum + (st.brands[b]?.val || 0), 0);
                channelTotalRow[`${b} QTY`] = qty;
                channelTotalRow[`${b} VALUE`] = Math.round(val);
            });
            channelTotalRow["TOTAL QTY"] = group.channelTotalQty;
            channelTotalRow["TOTAL VALUE"] = Math.round(group.channelTotalVal);

            excelRows.push(channelTotalRow);
            excelRows.push({}); // Empty row for spacing between channels
        });

        return excelRows;
    };


    // --- YAHAN PAR FILTERS PREPARE KAREIN ---
    const handleDownloadExcel = () => {
        // console.log("Full Report Header:", reportHeader);

       
        const currentFilters = {
            city: reportHeader.city || 'All Cities',
            channel: reportHeader.channel || 'All Channels',
            area: reportHeader.area || 'All Areas',
            store: reportHeader.store || 'All Stores',
            period: reportHeader.period || 'No Date Selected'
        };

        // Naya function call karein jo humne banaya hai
        handleExportToExcelWithFilters(
            getFormattedDataForExcel(),
            'Channel_Summary_Report',
            currentFilters
        );
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
                    <Paper elevation={0} sx={{ p: '4px 14px', bgcolor: '#1b2142', color: 'white', display: 'flex', gap: 2, borderRadius: '4px' }}>
                        <Typography sx={{ fontSize: '0.8rem' }}>Qty: <b>{Math.round(summary.grandTotalQty).toLocaleString()}</b></Typography>
                        <Typography sx={{ fontSize: '0.8rem' }}>Value: <b>{Math.round(summary.grandTotalVal).toLocaleString()}</b></Typography>
                    </Paper>
                )}
            </Box>

            {/* FILTERS */}
            <Paper variant="outlined" sx={{ m: 1, p: 1.5, borderRadius: '4px', border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                            label="From"
                            // Display format: May 01, 2026
                            format="MMM dd, yyyy"
                            value={parseISO(filters.fromDate)}
                            slotProps={{ textField: { size: 'small', sx: inputStyle } }}
                            onChange={(v) => setFilters({ ...filters, fromDate: format(v, 'yyyy-MM-dd') })}
                        />
                        <DatePicker
                            label="To"
                            format="MMM dd, yyyy"
                            value={parseISO(filters.toDate)}
                            slotProps={{ textField: { size: 'small', sx: inputStyle } }}
                            onChange={(v) => setFilters({ ...filters, toDate: format(v, 'yyyy-MM-dd') })}
                        />
                    </LocalizationProvider>

                    {/* MULTI-SELECT CITY */}
                    <TextField
                        select
                        label="City"
                        size="small"
                        value={filters.city_id}
                        sx={inputStyle}
                        onChange={(e) => setFilters({ ...filters, city_id: e.target.value })}
                        SelectProps={{
                            multiple: true,
                            renderValue: (selected) => {
                                if (selected.length === 0) return "All Cities";
                                return cities.filter(c => selected.includes(c.id)).map(c => c.name).join(', ');
                            }
                        }}
                    >
                        {cities.map(c => (
                            <MenuItem key={c.id} value={c.id}>
                                <Checkbox checked={filters.city_id.indexOf(c.id) > -1} size="small" />
                                <ListItemText primary={c.name} primaryTypographyProps={{ fontSize: '12px' }} />
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField select label="Area" size="small" value={filters.area} sx={inputStyle} onChange={(e) => setFilters({ ...filters, area: e.target.value })}>
                        <MenuItem value="">All Areas</MenuItem>
                        {areas.map((a, i) => <MenuItem key={i} value={a}>{a}</MenuItem>)}
                    </TextField>

                    {/* NEW STORE FILTER */}
                    <TextField select label="Store" size="small" value={filters.store_id} sx={inputStyle} onChange={(e) => setFilters({ ...filters, store_id: e.target.value })}>
                        <MenuItem value="">All Stores</MenuItem>
                        {stores.map(s => <MenuItem key={s.id} value={s.id}>{s.store_name}</MenuItem>)}
                    </TextField>

                    <TextField select label="Channel" size="small" value={filters.channel_id} sx={inputStyle} onChange={(e) => setFilters({ ...filters, channel_id: e.target.value })}>
                        <MenuItem value="">All Channels</MenuItem>
                        {channels.map(ch => <MenuItem key={ch.id} value={ch.id}>{ch.name}</MenuItem>)}
                    </TextField>

                    <Button variant="contained" onClick={handleGenerateReport} disabled={loading} size="small" sx={{ bgcolor: '#ab1d47', height: '36px', fontWeight: 'bold' }}>GENERATE</Button>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={handleDownloadExcel} // Ab yeh function call hoga
                        size="small"
                        sx={{ height: '36px', fontWeight: 'bold' }}
                    >
                        <FileDownload sx={{ fontSize: '16px', mr: 0.5 }} /> EXCEL
                    </Button>
                </Box>
            </Paper>

            {/* TABLE SECTION */}
            <Box sx={{ flexGrow: 1, px: 1, pb: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <TableContainer component={Paper} sx={{ flexGrow: 1, overflow: 'auto', boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: '4px' }}>

                    {/* DYNAMIC REPORT HEADER */}
                    {reportHeader.city && (
                        <Box sx={{ p: 3, px: 2, bgcolor: '#f8f9fa', borderBottom: '2px solid #ab1d47', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Map sx={{ fontSize: 16, color: '#ab1d47' }} />
                                <Typography sx={{ fontSize: '11px', fontWeight: 600 }}>City: <span style={{ color: '#ab1d47' }}>{reportHeader.city}</span></Typography>
                            </Box>

                            {/* CHANNEL SECTION */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Summarize sx={{ fontSize: 18, color: '#ab1d47' }} />
                                <Typography sx={{ fontSize: '11px', fontWeight: 600 }}>
                                    Channel: <span style={{ color: '#ab1d47', marginLeft: '4px' }}>
                                        {reportHeader.channel || 'All Channels'}
                                    </span>
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <LocationOn sx={{ fontSize: 16, color: '#ab1d47' }} />
                                <Typography sx={{ fontSize: '11px', fontWeight: 600 }}>Area: <span style={{ color: '#ab1d47' }}>{reportHeader.area}</span></Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <StoreIcon sx={{ fontSize: 16, color: '#ab1d47' }} />
                                <Typography sx={{ fontSize: '11px', fontWeight: 600 }}>Store: <span style={{ color: '#ab1d47' }}>{reportHeader.store}</span></Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CalendarToday sx={{ fontSize: 14, color: '#ab1d47' }} />
                                <Typography sx={{ fontSize: '11px', fontWeight: 600 }}>
                                    Period:
                                    <span style={{ color: '#1b2142', marginLeft: '6px' }}>
                                        {/* Pehli date format karein */}
                                        {format(parseISO(reportHeader.fromDate || filters.fromDate), 'MMM dd, yyyy')}

                                        <span style={{ margin: '0 8px', color: '#ab1d47', fontWeight: 'bold' }}> to </span>

                                        {/* Doosri date format karein */}
                                        {format(parseISO(reportHeader.toDate || filters.toDate), 'MMM dd, yyyy')}
                                    </span>
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    <Table stickyHeader size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                        <TableHead>
                            <TableRow sx={{ '& th': { bgcolor: '#1b2142', color: 'white', fontWeight: 'bold', fontSize: '10px', p: '6px 4px', borderRight: '1px solid #2c345a' } }}>
                                <TableCell colSpan={2} align="center">Store Details</TableCell>
                                {brands.map(b => <TableCell key={b} colSpan={2} align="center">{b}</TableCell>)}
                                <TableCell colSpan={2} align="center" sx={{ bgcolor: '#004d40 !important' }}>TOTAL</TableCell>
                            </TableRow>
                            <TableRow sx={{ '& th': { bgcolor: '#f5f5f5', fontSize: '9px', fontWeight: 'bold', p: '4px 8px', color: '#1b2142', borderRight: '1px solid #e0e0e0' } }}>
                                <TableCell sx={{ width: '160px', pl: 2 }}>Store Name</TableCell>  {/* Width increased */}
                                <TableCell sx={{ width: '100px' }}>Area</TableCell>       {/* Width increased */}
                                {brands.concat(["TOTAL"]).map((_, i) => (
                                    <React.Fragment key={i}>
                                        <TableCell align="center" sx={{ width: '28px' }}>Qty</TableCell>
                                        <TableCell align="center" sx={{ width: '52px' }}>Value</TableCell>
                                    </React.Fragment>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rawReportData.map((group, cIdx) => (
                                <React.Fragment key={cIdx}>
                                    <TableRow sx={{ bgcolor: '#fff5f7' }}>
                                        <TableCell colSpan={2 + (brands.length * 2) + 2} sx={{ fontWeight: 'bold', fontSize: '11px', color: '#ab1d47', py: 0.8, px: 2 }}>
                                            {group.channel.toUpperCase()}
                                        </TableCell>
                                    </TableRow>
                                    {group.stores.map((row, rIdx) => (
                                        <TableRow key={rIdx} hover sx={{ '& td': { fontSize: '10px', p: '4px 2px', borderRight: '1px solid #f0f0f0' } }}>
                                            <TableCell sx={{
                                                fontWeight: 600, pl: 2,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {row.storeName}
                                            </TableCell>
                                            <TableCell>{row.area}</TableCell>
                                            {brands.map(b => (
                                                <React.Fragment key={b}>
                                                    <TableCell align="center">{row.brands[b]?.qty || 0}</TableCell>
                                                    <TableCell align="right">{Math.round(row.brands[b]?.val || 0).toLocaleString()}</TableCell>
                                                </React.Fragment>
                                            ))}
                                            <TableCell align="center" sx={{ bgcolor: '#f1f8f7', fontWeight: 'bold', color: '#004d40' }}>{row.storeTotalQty}</TableCell>
                                            <TableCell align="right" sx={{ bgcolor: '#f1f8f7', fontWeight: 'bold', color: '#004d40' }}>{Math.round(Number(row.storeTotalVal)).toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow sx={{ bgcolor: '#1b2142', '& td': { color: 'white', fontWeight: 'bold', fontSize: '10px', py: 0.8 } }}>
                                        <TableCell colSpan={2} align="right" sx={{ pr: 3 }}>{group.channel.toUpperCase()} TOTAL:</TableCell>
                                        {brands.map(b => (
                                            <React.Fragment key={b}>
                                                <TableCell align="center">{group.stores.reduce((s, r) => s + (r.brands[b]?.qty || 0), 0)}</TableCell>
                                                <TableCell align="right">{Math.round(group.stores.reduce((s, r) => s + (r.brands[b]?.val || 0), 0)).toLocaleString()}</TableCell>
                                            </React.Fragment>
                                        ))}
                                        <TableCell align="center" sx={{ bgcolor: '#004d40' }}>{group.channelTotalQty}</TableCell>
                                        <TableCell align="right" sx={{ bgcolor: '#004d40' }}>{Math.round(Number(group.channelTotalVal)).toLocaleString()}</TableCell>
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

export default ChannelSummaryReport;