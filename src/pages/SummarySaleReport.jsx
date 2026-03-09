import React, { useEffect, useState } from 'react';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Button, CircularProgress, MenuItem
} from '@mui/material';
import { Summarize, FilterAlt } from '@mui/icons-material';
import API from '../api/API';

const SummaryReport = () => {
    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(false);

    // Dropdown States
    const [cities, setCities] = useState([]);
    const [stores, setStores] = useState([]);
    const [users, setUsers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);

    const [filters, setFilters] = useState({
        fromDate: format(new Date(), 'yyyy-MM-dd'),
        toDate: format(new Date(), 'yyyy-MM-dd'),
        city_id: '',
        store_id: '',
        ba_id: '',
        cat_id: '',
        subcat_id: ''
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [c, s, u, cat] = await Promise.all([
                    API.get('/cities'),
                    API.get('/store'),
                    API.get('/users'),
                    API.get('/category')
                ]);
                setCities(c.data);
                setStores(s.data.stores);
                setUsers(u.data.users);
                setCategories(cat.data);
            } catch (err) { console.error("Fetch Error:", err); }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (filters.cat_id) {
            API.get(`/subCategory/${filters.cat_id}`).then(res => setSubCategories(res.data));
        } else {
            setSubCategories([]);
        }
    }, [filters.cat_id]);

    const handleGenerateReport = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/reports/sales-report`, { params: filters });
            const rawData = res.data.data;
            const summaryMap = {};

            rawData.forEach(row => {
                const transactionKey = row.sale_id || `${row.date}-${row.storeName}-${row.baName}-${row.subCat}`;
                if (!summaryMap[transactionKey]) {
                    summaryMap[transactionKey] = { ...row, totalQty: 0, totalValue: 0 };
                }
                summaryMap[transactionKey].totalQty += (Number(row.qty) || 0);
                summaryMap[transactionKey].totalValue += (Number(row.amount) || 0);
            });

            setReport(Object.values(summaryMap));
        } catch (err) { alert("Data fetch nahi ho saka!"); }
        finally { setLoading(false); }
    };

    // Helper for input styling
    const inputStyle = { flex: 1, minWidth: '150px' };

    return (
        <Box sx={{ p: 2, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Summarize sx={{ mr: 1, color: '#ab1d47' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1b2142' }}>Summary Sales Report</Typography>
            </Box>

            <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>

                    {/* ROW 1: From, To, City, Store */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Box sx={inputStyle}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#555' }}>From Date</Typography>
                            <DatePicker
                                value={parseISO(filters.fromDate)}
                                onChange={(v) => setFilters({ ...filters, fromDate: format(v, 'yyyy-MM-dd') })}
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                        </Box>
                        <Box sx={inputStyle}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#555' }}>To Date</Typography>
                            <DatePicker
                                value={parseISO(filters.toDate)}
                                onChange={(v) => setFilters({ ...filters, toDate: format(v, 'yyyy-MM-dd') })}
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                        </Box>
                        <Box sx={inputStyle}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#555' }}>City</Typography>
                            <TextField select fullWidth size="small" value={filters.city_id} onChange={(e) => setFilters({ ...filters, city_id: e.target.value })}>
                                <MenuItem value="">All Cities</MenuItem>
                                {cities.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                            </TextField>
                        </Box>
                        <Box sx={inputStyle}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#555' }}>Store</Typography>
                            <TextField select fullWidth size="small" value={filters.store_id} onChange={(e) => setFilters({ ...filters, store_id: e.target.value })}>
                                <MenuItem value="">All Stores</MenuItem>
                                {stores.map(s => <MenuItem key={s.id} value={s.id}>{s.store_name}</MenuItem>)}
                            </TextField>
                        </Box>
                    </Box>

                    {/* ROW 2: BA, Category, Sub Category, Button */}
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                        <Box sx={inputStyle}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#555' }}>BA Name</Typography>
                            <TextField select fullWidth size="small" value={filters.ba_id} onChange={(e) => setFilters({ ...filters, ba_id: e.target.value })}>
                                <MenuItem value="">All BAs</MenuItem>
                                {users.map(u => <MenuItem key={u.id} value={u.id}>{u.fullname || u.name}</MenuItem>)}
                            </TextField>
                        </Box>
                        <Box sx={inputStyle}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#555' }}>Category</Typography>
                            <TextField select fullWidth size="small" value={filters.cat_id} onChange={(e) => setFilters({ ...filters, cat_id: e.target.value })}>
                                <MenuItem value="">All Categories</MenuItem>
                                {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.category_name}</MenuItem>)}
                            </TextField>
                        </Box>
                        <Box sx={inputStyle}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#555' }}>Sub Category</Typography>
                            <TextField select fullWidth size="small" value={filters.subcat_id} onChange={(e) => setFilters({ ...filters, subcat_id: e.target.value })} disabled={!filters.cat_id}>
                                <MenuItem value="">All Sub-Categories</MenuItem>
                                {subCategories.map(sc => <MenuItem key={sc.id} value={sc.id}>{sc.subcategory_name}</MenuItem>)}
                            </TextField>
                        </Box>
                        <Box sx={inputStyle}>
                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FilterAlt />}
                                onClick={handleGenerateReport}
                                sx={{ bgcolor: '#ab1d47', height: '40px', fontWeight: 'bold', '&:hover': { bgcolor: '#8e183a' } }}
                            >
                                GENERATE
                            </Button>
                        </Box>
                    </Box>

                </LocalizationProvider>
            </Paper>

            <TableContainer component={Paper} sx={{ borderRadius: 2, maxHeight: '65vh' }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {["Date", "City", "Store Name", "BA Name", "Category", "Sub Category", "Total Qty", "Value"].map((h) => (
                                <TableCell key={h} align="center" sx={{ bgcolor: '#1b2142', color: 'white', fontWeight: 'bold', py: 1.5 }}>{h}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={8} align="center" sx={{ py: 10 }}><CircularProgress color="secondary" /></TableCell></TableRow>
                        ) : report.length > 0 ? (
                            report.map((row, index) => (
                                <TableRow key={index} hover sx={{ '& td': { border: '1px solid #f0f0f0' } }}>
                                    <TableCell align="center">{row.date}</TableCell>
                                    <TableCell align="center">{row.city}</TableCell>
                                    <TableCell align="center">{row.storeName}</TableCell>
                                    <TableCell align="center">{row.baName}</TableCell>
                                    <TableCell align="center">{row.cat}</TableCell>
                                    <TableCell align="center">{row.subCat}</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', color: '#ab1d47' }}>{row.totalQty}</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>{Math.round(row.totalValue).toLocaleString()}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={8} align="center" sx={{ py: 5, color: '#999' }}>No data found for the selected filters.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default SummaryReport;