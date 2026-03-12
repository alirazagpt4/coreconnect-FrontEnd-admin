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
                    API.get('/store?limit=1000'),
                    API.get('/users?limit=1000'),
                    API.get('/category')
                ]);
                setCities(c.data);
                setStores(s.data.stores);
                const baUsersOnly = u.data.users.filter(user =>
                    user.designation && user.designation.name === "BA"
                );

                setUsers(baUsersOnly);
                setCategories(cat.data);
            } catch (err) { console.error("Fetch Error:", err); }
        };
        fetchInitialData();
    }, []);

    // FIXED: Category change hone par sub-category reset aur load karne ka logic
    useEffect(() => {
        if (filters.cat_id) {
            API.get(`/subCategory/${filters.cat_id}`).then(res => setSubCategories(res.data));
        } else {
            setSubCategories([]);
        }
        // Jab Category "All" ho ya badle, toh sub-category reset karein
        setFilters(prev => ({ ...prev, subcat_id: '' }));
    }, [filters.cat_id]);

    const handleGenerateReport = async () => {
        setLoading(true);

        // FIXED: Empty filters ko remove karein taake "All" select karne par query sahi jaye
        const cleanFilters = Object.fromEntries(
            Object.entries(filters).filter(([_, value]) => value !== "" && value !== null)
        );

        try {
            const res = await API.get(`/reports/sales-report`, { params: cleanFilters });
            const rawData = res.data.data || [];

            const summaryRows = [];
            rawData.forEach(sale => {
                sale.items.forEach(item => {
                    summaryRows.push({
                        date: sale.date,
                        city: sale.city,
                        storeName: sale.store,
                        baName: sale.baName,
                        cat: item.cat,
                        subCat: item.subCat,
                        totalQty: item.qty,
                        totalValue: item.value
                    });
                });
            });

            setReport(summaryRows);
        } catch (err) {
            console.error(err);
            alert("Data fetch nahi ho saka!");
        } finally { setLoading(false); }
    };

    const dateBoxStyle = { width: '180px' };

    return (
        <Box sx={{ p: 1.5, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <Summarize sx={{ mr: 1, color: '#ab1d47' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1b2142' }}>Summary Sales Report</Typography>
            </Box>

            <Paper sx={{ p: 2, mb: 1.5, borderRadius: 2 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5, alignItems: 'flex-end' }}>
                        <Box sx={dateBoxStyle}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 0.5, display: 'block' }}>From</Typography>
                            <DatePicker
                                value={parseISO(filters.fromDate)}
                                onChange={(v) => setFilters({ ...filters, fromDate: format(v, 'yyyy-MM-dd') })}
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                        </Box>
                        <Box sx={dateBoxStyle}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 0.5, display: 'block' }}>To</Typography>
                            <DatePicker
                                value={parseISO(filters.toDate)}
                                onChange={(v) => setFilters({ ...filters, toDate: format(v, 'yyyy-MM-dd') })}
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                        </Box>

                        <TextField select label="City" size="small" value={filters.city_id} onChange={(e) => setFilters({ ...filters, city_id: e.target.value })} sx={{ flex: 0.8 }}>
                            <MenuItem value="">All</MenuItem>
                            {cities.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                        </TextField>

                        <TextField select label="Store" size="small" value={filters.store_id} onChange={(e) => setFilters({ ...filters, store_id: e.target.value })} sx={{ flex: 1.2 }}>
                            <MenuItem value="">All</MenuItem>
                            {stores.map(s => <MenuItem key={s.id} value={s.id}>{s.store_name}</MenuItem>)}
                        </TextField>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <TextField select label="BA Name" size="small" value={filters.ba_id} onChange={(e) => setFilters({ ...filters, ba_id: e.target.value })} sx={{ flex: 1 }}>
                            <MenuItem value="">All</MenuItem>
                            {users.map(u => <MenuItem key={u.id} value={u.id}>{u.fullname || u.name}</MenuItem>)}
                        </TextField>

                        <TextField select label="Category" size="small" value={filters.cat_id} onChange={(e) => setFilters({ ...filters, cat_id: e.target.value })} sx={{ flex: 1 }}>
                            <MenuItem value="">All</MenuItem>
                            {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.category_name}</MenuItem>)}
                        </TextField>

                        <TextField select label="Sub-Category" size="small" value={filters.subcat_id} onChange={(e) => setFilters({ ...filters, subcat_id: e.target.value })} disabled={!filters.cat_id} sx={{ flex: 1 }}>
                            <MenuItem value="">All</MenuItem>
                            {subCategories.map(sc => <MenuItem key={sc.id} value={sc.id}>{sc.subcategory_name}</MenuItem>)}
                        </TextField>

                        <Button
                            variant="contained"
                            onClick={handleGenerateReport}
                            sx={{
                                bgcolor: '#ab1d47',
                                minWidth: '150px',
                                height: '40px',
                                fontWeight: 'bold',
                                '&:hover': { bgcolor: '#8e183a' }
                            }}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FilterAlt />}
                        >
                            {loading ? "FETCHING..." : "GENERATE"}
                        </Button>
                    </Box>
                </LocalizationProvider>
            </Paper>

            <TableContainer component={Paper} sx={{ borderRadius: 2, maxHeight: 'calc(100vh - 250px)' }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {["Date", "City", "Store Name", "BA Name", "Category", "Sub Category", "Total Qty", "Value"].map((h) => (
                                <TableCell key={h} align="center" sx={{ bgcolor: '#1b2142', color: 'white', fontWeight: 'bold', fontSize: '12px', py: 1.5 }}>{h}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={8} align="center" sx={{ py: 10 }}><CircularProgress color="secondary" /></TableCell></TableRow>
                        ) : report.length > 0 ? (
                            report.map((row, index) => (
                                <TableRow key={index} hover sx={{ '& td': { fontSize: '11px', borderBottom: '1px solid #f0f0f0' } }}>
                                    <TableCell align="center">{row.date}</TableCell>
                                    <TableCell align="center">{row.city}</TableCell>
                                    <TableCell align="center">{row.storeName}</TableCell>
                                    <TableCell align="center">{row.baName}</TableCell>
                                    <TableCell align="center">{row.cat}</TableCell>
                                    <TableCell align="center">{row.subCat}</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', color: '#ab1d47', bgcolor: '#fff5f7' }}>{row.totalQty}</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>{Math.round(row.totalValue).toLocaleString()}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={8} align="center" sx={{ py: 5, color: '#999' }}>No data found.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default SummaryReport;