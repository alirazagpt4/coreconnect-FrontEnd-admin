import React, { useEffect, useState } from 'react';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Button, CircularProgress, MenuItem
} from '@mui/material';
import { Science, FilterAlt, FileDownload } from '@mui/icons-material';
import API from '../api/API';
import { handleExportToExcel } from '../utils/exportUtils';

const ShortTestersReport = () => {
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Dropdown States
    const [cities, setCities] = useState([]);
    const [channels, setChannels] = useState([]);
    const [stores, setStores] = useState([]);
    const [users, setUsers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [itemsList, setItemsList] = useState([]);

    const [filters, setFilters] = useState({
        fromDate: format(new Date(), 'yyyy-MM-dd'),
        toDate: format(new Date(), 'yyyy-MM-dd'),
        city_id: '',
        store_id: '',
        ba_user_id: '',
        category_id: '',
        subcategory_id: '',
        item_id: '',
        channel_id: ''
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [c, ch, s, u, cat, items] = await Promise.all([
                    API.get('/cities'),
                    API.get('/channels/getchannels'),
                    API.get('/store?limit=1000'),
                    API.get('/users?limit=1000'),
                    API.get('/category'),
                    API.get('/items?limit=1000')
                ]);
                setCities(c.data);
                setChannels(ch.data);
                setStores(s.data.stores || []);
                setUsers(u.data.users.filter(user => user.designation?.name === "BA"));
                setCategories(cat.data || []);
                setItemsList(items.data.items || []);
            } catch (err) { console.error("Fetch Error:", err); }
        };
        fetchInitialData();
    }, []);

    // Dependent Sub-Category Fetching
    useEffect(() => {
        if (filters.category_id) {
            API.get(`/subCategory/${filters.category_id}`).then(res => setSubCategories(res.data));
        } else {
            setSubCategories([]);
        }
        setFilters(prev => ({ ...prev, subcategory_id: '', item_id: '' }));
    }, [filters.category_id]);

    const handleGenerateReport = async () => {
        setLoading(true);
        const cleanFilters = Object.fromEntries(
            Object.entries(filters).filter(([_, value]) => value !== "" && value !== null)
        );
        try {
            const res = await API.get(`/reports/tester-report`, { params: cleanFilters });
            setReportData(res.data.data || []);
        } catch (err) {
            alert("Tester report fetch nahi ho saki!");
        } finally {
            setLoading(false);
        }
    };

    const formatDateDisplay = (dateStr) => {
        try { return format(parseISO(dateStr), 'dd MMM yyyy'); }
        catch (e) { return dateStr || 'N/A'; }
    };

    const downloadExcel = () => {
        if (!reportData.length) return alert("Generate report first!");
        const rowsForExcel = reportData.map((row) => ({
            "Date": formatDateDisplay(row.date),
            "Channel": row.channelName,
            "City": row.cityName,
            "Store": row.storeName,
            "BA Name": row.baName,
            "Category": row.categoryName,
            "Item Name": row.itemName
        }));
        handleExportToExcel(rowsForExcel, "Short_Testers_Report");
    };

    return (
        <Box sx={{ p: 1.5, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <Science sx={{ mr: 1, color: '#ab1d47' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1b2142' }}>Short Testers Report</Typography>
            </Box>

            <Paper sx={{ p: 2, mb: 1.5, borderRadius: 2 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    {/* ROW 1: Regional & User Filters */}
                    <Box sx={{ display: 'flex', gap: 1.5, mb: 2, alignItems: 'flex-end' }}>
                        <Box sx={{ width: '150px' }}>
                            <DatePicker
                                label="From"
                                value={parseISO(filters.fromDate)}
                                onChange={(v) => setFilters({ ...filters, fromDate: format(v, 'yyyy-MM-dd') })}
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                        </Box>
                        <Box sx={{ width: '150px' }}>
                            <DatePicker
                                label="To"
                                value={parseISO(filters.toDate)}
                                onChange={(v) => setFilters({ ...filters, toDate: format(v, 'yyyy-MM-dd') })}
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                        </Box>
                        <TextField select label="City" size="small" value={filters.city_id} onChange={(e) => setFilters({ ...filters, city_id: e.target.value, store_id: '' })} sx={{ flex: 1 }}>
                            <MenuItem value="">All</MenuItem>
                            {cities.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                        </TextField>
                        <TextField select label="Channel" size="small" value={filters.channel_id} onChange={(e) => setFilters({ ...filters, channel_id: e.target.value })} sx={{ flex: 1 }}>
                            <MenuItem value="">All</MenuItem>
                            {channels.map(ch => <MenuItem key={ch.id} value={ch.id}>{ch.name}</MenuItem>)}
                        </TextField>
                        <TextField select label="Store" size="small" value={filters.store_id} onChange={(e) => setFilters({ ...filters, store_id: e.target.value })} sx={{ flex: 1.2 }}>
                            <MenuItem value="">All</MenuItem>
                            {stores.filter(s => !filters.city_id || String(s.city_id) === String(filters.city_id)).map(s => (
                                <MenuItem key={s.id} value={s.id}>{s.store_name} {s.area ? `(${s.area})` : ''}</MenuItem>
                            ))}
                        </TextField>
                        <TextField select label="BA Name" size="small" value={filters.ba_user_id} onChange={(e) => setFilters({ ...filters, ba_user_id: e.target.value })} sx={{ flex: 1 }}>
                            <MenuItem value="">All</MenuItem>
                            {users.map(u => <MenuItem key={u.id} value={u.id}>{u.fullname || u.name}</MenuItem>)}
                        </TextField>
                    </Box>

                    {/* ROW 2: Product Filters & Buttons */}
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <TextField select label="Category" size="small" value={filters.category_id} onChange={(e) => setFilters({ ...filters, category_id: e.target.value })} sx={{ flex: 1 }}>
                            <MenuItem value="">All</MenuItem>
                            {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.category_name}</MenuItem>)}
                        </TextField>
                        <TextField select label="Sub-Category" size="small" value={filters.subcategory_id} onChange={(e) => setFilters({ ...filters, subcategory_id: e.target.value })} disabled={!filters.category_id} sx={{ flex: 1 }}>
                            <MenuItem value="">All</MenuItem>
                            {subCategories.map(sc => <MenuItem key={sc.id} value={sc.id}>{sc.subcategory_name}</MenuItem>)}
                        </TextField>
                        <TextField select label="Select Item" size="small" value={filters.item_id} onChange={(e) => setFilters({ ...filters, item_id: e.target.value })} sx={{ flex: 1.5 }}>
                            <MenuItem value="">All Items</MenuItem>
                            {itemsList
                                .filter(i => (!filters.category_id || String(i.category_id) === String(filters.category_id)) && (!filters.subcategory_id || String(i.subcategory_id) === String(filters.subcategory_id)))
                                .map(i => <MenuItem key={i.id} value={i.id}>{i.product_name}</MenuItem>)
                            }
                        </TextField>
                        <Button
                            variant="contained"
                            onClick={handleGenerateReport}
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FilterAlt />}
                            sx={{ bgcolor: '#ab1d47', fontWeight: 'bold', minWidth: '140px' }}
                        >
                            GENERATE
                        </Button>
                        <Button
                            variant="contained"
                            color="success"
                            onClick={downloadExcel}
                            disabled={loading || reportData.length === 0}
                            startIcon={<FileDownload />}
                            sx={{ fontWeight: 'bold' }}
                        >
                            EXPORT
                        </Button>
                    </Box>
                </LocalizationProvider>
            </Paper>

            <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 300px)', borderRadius: 2 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {["Date", "Channel", "City", "Store", "BA Name", "Category", "Item Name"].map(h => (
                                <TableCell key={h} align="center" sx={{ bgcolor: '#1b2142', color: 'white', fontWeight: 'bold', fontSize: '12px' }}>{h}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={7} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
                        ) : reportData.length > 0 ? (
                            reportData.map((row, idx) => (
                                <TableRow key={idx} hover sx={{ '& td': { fontSize: '11px' } }}>
                                    <TableCell align="center">{formatDateDisplay(row.date)}</TableCell>
                                    <TableCell align="center">{row.channelName}</TableCell>
                                    <TableCell align="center">{row.cityName}</TableCell>
                                    <TableCell align="center">{row.storeName}</TableCell>
                                    <TableCell align="center">{row.baName}</TableCell>
                                    <TableCell align="center">{row.categoryName}</TableCell>
                                    <TableCell align="left" sx={{ color: '#ab1d47', fontWeight: 'bold' }}>{row.itemName}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: '#999' }}>No testers found.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default ShortTestersReport;