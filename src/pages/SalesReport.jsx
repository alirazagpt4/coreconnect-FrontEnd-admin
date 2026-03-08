import React, { useEffect, useState } from 'react';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Button, CircularProgress, MenuItem, Grid
} from '@mui/material';
import { Assessment, FilterAlt } from '@mui/icons-material';
import API from '../api/API';

const SalesReport = () => {
    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(false);

    // Dropdown Data States
    const [cities, setCities] = useState([]);
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
        ba_id: '',
        cat_id: '',
        subcat_id: '',
        item_id: ''
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [c, s, u, cat, items] = await Promise.all([
                    API.get('/cities'),
                    API.get('/store'),
                    API.get('/users'),
                    API.get('/category'),
                    API.get('/items')
                ]);
                setCities(c.data);
                setStores(s.data.stores);
                setUsers(u.data.users);
                setCategories(cat.data);
                setItemsList(items.data.items);
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
            setReport(res.data.data);
            console.log("dataaaaa ...", res.data.data)
        } catch (err) { alert("Data fetch nahi ho saka!"); }
        finally { setLoading(false); }
    };

    const getSpan = (data, index, cols) => {
        let span = 1;
        for (let i = index + 1; i < data.length; i++) {
            let isMatch = true;
            for (let col of cols) {
                if (data[i][col] !== data[index][col]) { isMatch = false; break; }
            }
            if (isMatch) span++; else break;
        }
        return span;
    };

    const isFirst = (index, cols) => {
        if (index === 0) return true;
        for (let col of cols) {
            if (report[index][col] !== report[index - 1][col]) return true;
        }
        return false;
    };

    return (
        <Box sx={{ p: 2, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assessment sx={{ mr: 1, color: '#ab1d47' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1b2142' }}>Daily Sales Report</Typography>
            </Box>

            <Paper sx={{ p: 2, mb: 2, borderRadius: 2, boxShadow: '0px 2px 8px rgba(0,0,0,0.1)' }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>

                    {/* --- ROW 1: Dates (Choti Width), City, Store, BA --- */}
                    <Grid container spacing={3} alignItems="flex-end" sx={{ mb: 2 }}>
                        {/* Fixed width for From Date */}
                        <Grid item sx={{ width: '145px' }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#555', display: 'block', mb: 0.5 }}>From Date</Typography>
                            <DatePicker
                                value={parseISO(filters.fromDate)}
                                onChange={(v) => setFilters({ ...filters, fromDate: format(v, 'yyyy-MM-dd') })}
                                slotProps={{ textField: { size: 'small' } }}
                            />
                        </Grid>

                        {/* Fixed width for To Date */}
                        <Grid item sx={{ width: '145px' }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#555', display: 'block', mb: 0.5 }}>To Date</Typography>
                            <DatePicker
                                value={parseISO(filters.toDate)}
                                onChange={(v) => setFilters({ ...filters, toDate: format(v, 'yyyy-MM-dd') })}
                                slotProps={{ textField: { size: 'small' } }}
                            />
                        </Grid>

                        {/* City takes some space */}
                        <Grid item xs={2}>
                            <Typography variant="caption" sx={{ width: '200px', fontWeight: 'bold', color: '#555', display: 'block', mb: 0.5 }}>City</Typography>
                            <TextField select fullWidth size="small" value={filters.city_id} onChange={(e) => setFilters({ ...filters, city_id: e.target.value })}>
                                <MenuItem value="">All Cities</MenuItem>
                                {cities.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                            </TextField>
                        </Grid>

                        {/* Store takes remaining space */}
                        <Grid item xs={2}>
                            <Typography variant="caption" sx={{ width: '200px', fontWeight: 'bold', color: '#555', display: 'block', mb: 0.5 }}>Store</Typography>
                            <TextField select fullWidth size="small" value={filters.store_id} onChange={(e) => setFilters({ ...filters, store_id: e.target.value })}>
                                <MenuItem value="">All Stores</MenuItem>
                                {stores.map(s => <MenuItem key={s.id} value={s.id}>{s.store_name}</MenuItem>)}
                            </TextField>
                        </Grid>

                        {/* BA Name takes remaining space */}
                        <Grid item xs={2}>
                            <Typography variant="caption" sx={{ width: '200px', fontWeight: 'bold', color: '#555', display: 'block', mb: 0.5 }}>BA Name</Typography>
                            <TextField select fullWidth size="small" value={filters.ba_id} onChange={(e) => setFilters({ ...filters, ba_id: e.target.value })}>
                                <MenuItem value="">All BAs</MenuItem>
                                {users.map(u => <MenuItem key={u.id} value={u.id}>{u.fullname || u.name}</MenuItem>)}
                            </TextField>
                        </Grid>
                    </Grid>

                    {/* --- ROW 2: Category, Sub Category, Items, Button --- */}
                    <Grid container spacing={3} alignItems="flex-end">
                        <Grid item xs={2}>
                            <Typography variant="caption" sx={{ width: '200px', fontWeight: 'bold', color: '#555', display: 'block', mb: 0.5 }}>Category</Typography>
                            <TextField select fullWidth size="small" value={filters.cat_id} onChange={(e) => setFilters({ ...filters, cat_id: e.target.value })}>
                                <MenuItem value="">All Categories</MenuItem>
                                {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.category_name}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={2}>
                            <Typography variant="caption" sx={{ width: '200px', fontWeight: 'bold', color: '#555', display: 'block', mb: 0.5 }}>Sub Category</Typography>
                            <TextField select fullWidth size="small" value={filters.subcat_id} onChange={(e) => setFilters({ ...filters, subcat_id: e.target.value })} disabled={!filters.cat_id}>
                                <MenuItem value="">All Sub-Categories</MenuItem>
                                {subCategories.map(sc => <MenuItem key={sc.id} value={sc.id}>{sc.subcategory_name}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={2}>
                            <Typography variant="caption" sx={{ width: '300px', fontWeight: 'bold', color: '#555', display: 'block', mb: 0.5 }}>Select Item</Typography>
                            <TextField select fullWidth size="small" value={filters.item_id} onChange={(e) => setFilters({ ...filters, item_id: e.target.value })}>
                                <MenuItem value="">All Items</MenuItem>
                                {itemsList.map(i => <MenuItem key={i.id} value={i.id}>{i.product_name}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs>
                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FilterAlt />}
                                onClick={handleGenerateReport}
                                sx={{ bgcolor: '#ab1d47', fontWeight: 'bold', height: '40px', '&:hover': { bgcolor: '#8e183a' } }}
                            >
                                {loading ? "..." : "GENERATE REPORT"}
                            </Button>
                        </Grid>
                    </Grid>
                </LocalizationProvider>
            </Paper>

            {/* --- Table Section --- */}
            <TableContainer component={Paper} sx={{ maxHeight: '65vh', borderRadius: 2 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {["Date", "City", "Store", "BA Name", "Cat", "Sub Cat", "RP", "Item", "Qty", "Value"].map(h => (
                                <TableCell key={h} align="center" sx={{ bgcolor: '#1b2142', color: 'white', fontWeight: 'bold', py: 1.2, border: '1px solid #2e3558' }}>{h}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={8} align="center" sx={{ py: 8 }}><CircularProgress color="secondary" /></TableCell></TableRow>
                        ) : report.length > 0 ? (
                            report.map((row, index) => (
                                <TableRow key={index} hover sx={{ '& td': { border: '1px solid #eee' } }}>
                                    {isFirst(index, ['date']) && <TableCell rowSpan={getSpan(report, index, ['date'])} align="center" sx={{ fontWeight: 'bold' }}>{row.date}</TableCell>}
                                    {isFirst(index, ['date', 'city']) && <TableCell rowSpan={getSpan(report, index, ['date', 'city'])} align="center">{row.city}</TableCell>}
                                    {isFirst(index, ['date', 'city', 'storeName']) && <TableCell rowSpan={getSpan(report, index, ['date', 'city', 'storeName'])} align="center">{row.storeName}</TableCell>}
                                    {isFirst(index, ['date', 'city', 'storeName', 'baName']) && <TableCell rowSpan={getSpan(report, index, ['date', 'city', 'storeName', 'baName'])} align="center" >{row.baName}</TableCell>}
                                    {isFirst(index, ['date', 'city', 'storeName', 'baName', 'cat']) && <TableCell rowSpan={getSpan(report, index, ['date', 'city', 'storeName', 'baName', 'cat'])} align="center">{row.cat}</TableCell>}
                                    {isFirst(index, ['date', 'city', 'storeName', 'baName', 'cat', 'subCat']) && <TableCell rowSpan={getSpan(report, index, ['date', 'city', 'storeName', 'baName', 'cat', 'subCat'])} align="center">{row.subCat}</TableCell>}
                                    <TableCell align="left">{Math.round(parseFloat(row.price || 0)).toLocaleString()}</TableCell>
                                    <TableCell align="left">{row.item}</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>{row.qty || 0}</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>{Math.round(parseFloat(row.amount || 0)).toLocaleString()}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: '#999' }}>No data available.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default SalesReport;