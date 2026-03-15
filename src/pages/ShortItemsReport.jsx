import React, { useEffect, useState } from 'react';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Button, CircularProgress, MenuItem
} from '@mui/material';
import { Inventory, FilterAlt, FileDownload } from '@mui/icons-material';
import API from '../api/API';
import { handleExportToExcel } from '../utils/exportUtils';

const ShortItemsReport = () => {
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Dropdown States
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
        ba_user_id: '',
        category_id: '',
        subcategory_id: '',
        item_id: ''
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // limit=1000 add kiya hai taake data poora aaye
                const [c, s, u, cat, items] = await Promise.all([
                    API.get('/cities'),
                    API.get('/store?limit=1000'),
                    API.get('/users?limit=1000'),
                    API.get('/category'),
                    API.get('/items?limit=1000')
                ]);
                setCities(c.data);
                setStores(s.data.stores || []);
                const baUsersOnly = u.data.users.filter(user =>
                    user.designation && user.designation.name === "BA"
                );

                setUsers(baUsersOnly);
                setCategories(cat.data || []);
                setItemsList(items.data.items || []);
            } catch (err) { console.error("Fetch Error:", err); }
        };
        fetchInitialData();
    }, []);

    // FIXED: Category change hone par sub-category reset aur load karne ka logic
    useEffect(() => {
        if (filters.category_id) {
            API.get(`/subCategory/${filters.category_id}`).then(res => setSubCategories(res.data));
        } else {
            setSubCategories([]);
        }
        // Category badalte hi sub-category dropdown reset
        setFilters(prev => ({ ...prev, subcategory_id: '' }));
    }, [filters.category_id]);

    const handleGenerateReport = async () => {
        setLoading(true);

        // FIXED: Empty filters ko remove karne ka logic (All select karne par issue nahi aayega)
        const cleanFilters = Object.fromEntries(
            Object.entries(filters).filter(([_, value]) => value !== "" && value !== null)
        );

        try {
            const res = await API.get(`/reports/shortitems-report`, { params: cleanFilters });
            console.log("short items report", res.data.data);
            setReportData(res.data.data);
        } catch (err) {
            alert("Report fetch nahi ho saki!");
        } finally {
            setLoading(false);
        }
    };

    const formatDateDisplay = (dateStr) => {
        try {
            return format(parseISO(dateStr), 'dd MMM yyyy');
        } catch (e) {
            return dateStr;
        }
    };



    const downloadExcel = () => {
        if (!reportData || reportData.length === 0) {
            alert("generate report first!");
            return;
        }

        // Data ko Excel format ke liye flat karna
        const rowsForExcel = reportData.map((row) => ({
            "Date": formatDateDisplay(row.date),
            "City": row.cityName,
            "Store": row.storeName,
            "Area": row.areaName || row.area || 'N/A',
            "BA Name": row.baName,
            "Category": row.categoryName,
            "Sub Category": row.subCategoryName,
            "Item Name": row.itemName
        }));

        handleExportToExcel(rowsForExcel, "Short_Items_Report");
    };

    return (
        <Box sx={{ p: 1.5, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Inventory sx={{ mr: 1, color: '#ab1d47' }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1b2142' }}>Short Items Report</Typography>
                </Box>
            </Box>

            <Paper sx={{ p: 2, mb: 1.5, borderRadius: 2 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    {/* ROW 1: Dates, City, Store, BA */}
                    <Box sx={{ display: 'flex', gap: 1.5, mb: 2, alignItems: 'flex-end', flexWrap: 'nowrap' }}>
                        <Box sx={{ width: '180px' }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 0.5, display: 'block' }}>From</Typography>
                            <DatePicker
                                value={parseISO(filters.fromDate)}
                                onChange={(v) => setFilters({ ...filters, fromDate: format(v, 'yyyy-MM-dd') })}
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                        </Box>
                        <Box sx={{ width: '180px' }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 0.5, display: 'block' }}>To</Typography>
                            <DatePicker
                                value={parseISO(filters.toDate)}
                                onChange={(v) => setFilters({ ...filters, toDate: format(v, 'yyyy-MM-dd') })}
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                        </Box>

                        <TextField select label="City" size="small" value={filters.city_id} onChange={(e) => setFilters({ ...filters, city_id: e.target.value, store_id: '' })} sx={{ flex: 0.8, minWidth: '100px' }}>
                            <MenuItem value="">All</MenuItem>
                            {cities.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                        </TextField>

                        <TextField select label="Store" size="small" value={filters.store_id} onChange={(e) => setFilters({ ...filters, store_id: e.target.value })} sx={{ flex: 1, minWidth: '120px' }}>
                            <MenuItem value="">All</MenuItem>
                            {stores.filter(s => !filters.city_id || String(s.city_id) === String(filters.city_id)).map(s => (
                                // Store Name ke saath Area add kiya
                                <MenuItem key={s.id} value={s.id}>{s.store_name} {s.area ? `(${s.area})` : ''}</MenuItem>
                            ))}
                        </TextField>

                        <TextField select label="BA Name" size="small" value={filters.ba_user_id} onChange={(e) => setFilters({ ...filters, ba_user_id: e.target.value })} sx={{ flex: 1, minWidth: '130px' }}>
                            <MenuItem value="">All</MenuItem>
                            {users.map(u => <MenuItem key={u.id} value={u.id}>{u.fullname || u.name}</MenuItem>)}
                        </TextField>
                    </Box>

                    {/* ROW 2: Category, Sub-Cat, Item + Generate Button */}
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <TextField select label="Category" size="small" value={filters.category_id} onChange={(e) => setFilters({ ...filters, category_id: e.target.value })} sx={{ flex: 1 }}>
                            <MenuItem value="">All</MenuItem>
                            {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.category_name}</MenuItem>)}
                        </TextField>

                        <TextField select label="Sub-Category" size="small" value={filters.subcategory_id} onChange={(e) => setFilters({ ...filters, subcategory_id: e.target.value })} disabled={!filters.category_id} sx={{ flex: 1 }}>
                            <MenuItem value="">All</MenuItem>
                            {subCategories.map(sc => <MenuItem key={sc.id} value={sc.id}>{sc.subcategory_name}</MenuItem>)}
                        </TextField>

                        <TextField select label="Select Item" size="small" value={filters.item_id} onChange={(e) => setFilters({ ...filters, item_id: e.target.value })} sx={{ flex: 2 }}>
                            <MenuItem value="">All Items</MenuItem>
                            {itemsList
                                .filter(i => {
                                    const catMatch = !filters.category_id || String(i.category_id) === String(filters.category_id);
                                    const subMatch = !filters.subcategory_id || String(i.subcategory_id) === String(filters.subcategory_id);
                                    return catMatch && subMatch;
                                })
                                .map(i => <MenuItem key={i.id} value={i.id}>{i.product_name}</MenuItem>)
                            }
                        </TextField>

                        <Button
                            variant="contained"
                            onClick={handleGenerateReport}
                            sx={{
                                bgcolor: '#ab1d47',
                                minWidth: '160px',
                                height: '40px',
                                fontWeight: 'bold',
                                '&:hover': { bgcolor: '#8e183a' }
                            }}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FilterAlt />}
                        >
                            {loading ? "FETCHING..." : "GENERATE"}
                        </Button>
                        <Button
                            variant="contained"
                            color="success"
                            onClick={downloadExcel}
                            disabled={loading || reportData.length === 0}
                            startIcon={<FileDownload />}
                            sx={{
                                height: '40px',
                                fontWeight: 'bold',
                                ml: 1.5,
                                bgcolor: '#2e7d32'
                            }}
                        >
                            EXPORT
                        </Button>
                    </Box>
                </LocalizationProvider>
            </Paper>

            <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 250px)', borderRadius: 2 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {/* "Area" column add kar di gayi hai */}
                            {["Date", "City", "Store", "Area", "BA Name", "Category", "Sub Category", "Item Name"].map(h => (
                                <TableCell key={h} align="center" sx={{ bgcolor: '#1b2142', color: 'white', fontWeight: 'bold', fontSize: '12px', py: 1 }}>{h}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={8} align="center" sx={{ py: 8 }}><CircularProgress color="secondary" /></TableCell></TableRow>
                        ) : reportData.length > 0 ? (
                            reportData.map((row, idx) => (
                                <TableRow key={idx} hover sx={{ '& td': { fontSize: '11px', borderBottom: '1px solid #f0f0f0' } }}>
                                    <TableCell align="center">{formatDateDisplay(row.date)}</TableCell>
                                    <TableCell align="center">{row.cityName}</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 500 }}>{row.storeName}</TableCell>
                                    <TableCell align="center" sx={{ color: '#666' }}>{row.areaName || row.area || 'N/A'}</TableCell>
                                    <TableCell align="center">{row.baName}</TableCell>
                                    <TableCell align="center">{row.categoryName}</TableCell>
                                    <TableCell align="center">{row.subCategoryName}</TableCell>
                                    <TableCell align="left" sx={{ color: '#ab1d47', fontWeight: 'bold' }}>{row.itemName}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: '#999' }}>No short items found for selected filters.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default ShortItemsReport;