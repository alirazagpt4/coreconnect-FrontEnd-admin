import React, { useEffect, useState } from 'react';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Button, CircularProgress, MenuItem, Divider
} from '@mui/material';
import { Assessment, FileDownload, FilterAlt, ReceiptLong } from '@mui/icons-material';
import API from '../api/API';

import { handleExportToExcel } from '../utils/exportUtils.js';

const SalesReport = () => {
    const [reportData, setReportData] = useState({
        data: [],
        summary: { totalTransactions: 0, grandTotalQty: 0, grandTotalAmount: 0 }
    });
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
                    API.get('/store?limit=1000'),
                    API.get('/users?limit=1000'),
                    API.get('/category'),
                    API.get('/items?limit=2000')
                ]);
                setCities(c.data);
                setStores(s.data.stores);
                const baUsersOnly = u.data.users.filter(user =>
                    user.designation && user.designation.name === "BA"
                );

                setUsers(baUsersOnly);
                setCategories(cat.data);
                setItemsList(items.data.items);
            } catch (err) { console.error("Fetch Error:", err); }
        };
        fetchInitialData();
    }, []);

    // Jab Category badle toh Sub-Category reset aur load karein
    useEffect(() => {
        if (filters.cat_id) {
            API.get(`/subCategory/${filters.cat_id}`).then(res => setSubCategories(res.data));
        } else {
            setSubCategories([]);
        }

        // Yahan state update ho rahi hai, lekin handleGenerateReport ko manual click chahiye hota hai
        setFilters(prev => ({
            ...prev,
            subcat_id: '',
            item_id: ''
        }));
    }, [filters.cat_id]);

    // Jab Sub-category badle toh Item reset karein
    useEffect(() => {
        setFilters(prev => ({ ...prev, item_id: '' }));
    }, [filters.subcat_id]);



    const handleGenerateReport = async () => {
        setLoading(true);

        // Filter out empty strings, nulls, and undefined
        const cleanFilters = Object.fromEntries(
            Object.entries(filters).filter(([_, value]) =>
                value !== "" && value !== null && value !== undefined
            )
        );

        try {
            const res = await API.get(`/reports/sales-report`, { params: cleanFilters });
            setReportData(res.data);
        } catch (err) {
            console.error("Report Error:", err);
            alert("Data fetch nahi ho saka!");
        } finally {
            setLoading(false);
        }
    };

    const filterBoxStyle = { flex: 1, minWidth: '120px' };
    const dateBoxStyle = { flex: 0.6, minWidth: '100px' };


    const downloadExcel = () => {
        if (!reportData.data || reportData.data.length === 0) {
            alert("generate report first");
            return;
        }

        const rowsForExcel = [];

        // 1. Transactions aur Items ka data add karein
        reportData.data.forEach((transaction) => {
            transaction.items.forEach((item) => {
                rowsForExcel.push({
                    "Date": transaction.date,
                    "City": transaction.city,
                    "Store": transaction.store,
                    "BA Name": transaction.baName,
                    "Category": item.cat,
                    "Sub Category": item.subCat,
                    "Product Name": item.itemName,
                    "MRP": item.rp.toLocaleString(),
                    "Qty": item.qty.toLocaleString(),
                    "Total Value": item.value.toLocaleString()
                });
            });

            // Transaction ka sub-total line
            rowsForExcel.push({
                "Date": "", "City": "", "Store": "", "BA Name": "TRANSACTION TOTAL",
                "Category": "", "Sub Category": "", "Product Name": "", "MRP": "",
                "Quantity": transaction.subTotalQty,
                "Total Value": transaction.subTotalAmount
            });

            // Ek khali line gap ke liye
            rowsForExcel.push({});
        });

        // 2. Sab se niche Grand Total add karein
        rowsForExcel.push({
            "Date": "GRAND TOTAL",
            "City": "", "Store": "", "BA Name": "", "Category": "", "Sub Category": "", "Product Name": "", "MRP": "",
            "Quantity": reportData.summary.grandTotalQty,
            "Total Value": reportData.summary.grandTotalAmount
        });

        // Util function ko call karein
        handleExportToExcel(rowsForExcel, "Sales_Report");
    };

    return (
        <>

            <Box sx={{ p: 1.5, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
                {/* TOP HEADER: Title + Grand Totals */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                    flexWrap: 'wrap',
                    gap: 2
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Assessment sx={{ mr: 1, color: '#ab1d47' }} />
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1b2142' }}>
                            Sales Report
                        </Typography>
                    </Box>

                    {/* GRAND TOTAL SUMMARY (Hamesha nazar aayega) */}
                    <Paper sx={{
                        display: 'flex',
                        gap: 4,
                        p: 1.2,
                        px: 3,
                        bgcolor: '#1b2142',
                        color: 'white',
                        borderRadius: 2,
                        alignItems: 'center',
                        boxShadow: '0px 4px 10px rgba(0,0,0,0.15)'
                    }}>
                        {/* Transactions */}
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: '#aaa', display: 'block', lineHeight: 1, fontSize: '0.65rem' }}>Transactions</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {reportData?.summary?.totalTransactions || 0}
                            </Typography>
                        </Box>

                        <Divider orientation="vertical" flexItem sx={{ bgcolor: '#444', height: '25px', alignSelf: 'center' }} />

                        {/* Sold Qty */}
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: '#aaa', display: 'block', lineHeight: 1, fontSize: '0.65rem' }}>Sold Qty</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#ffeb3b' }}>
                                {(reportData?.summary?.grandTotalQty || 0).toLocaleString()}
                            </Typography>
                        </Box>

                        <Divider orientation="vertical" flexItem sx={{ bgcolor: '#444', height: '25px', alignSelf: 'center' }} />

                        {/* Total Value */}
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: '#aaa', display: 'block', lineHeight: 1, fontSize: '0.65rem' }}>Total Value</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                                Rs. {Math.round(reportData?.summary?.grandTotalAmount || 0).toLocaleString()}
                            </Typography>
                        </Box>
                    </Paper>
                </Box>

                <Paper sx={{ p: 2, mb: 1.5, borderRadius: 2 }}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        {/* ROW 1: Dates aur Primary Filters */}
                        <Box sx={{
                            display: 'flex',
                            gap: 1.5,
                            mb: 2,
                            alignItems: 'flex-end', // Labels ko bottom se align karega
                            flexWrap: 'nowrap'
                        }}>
                            {/* From Date - Fixed Width di hai taake date poori nazar aaye */}
                            <Box sx={{ width: '180px' }}>
                                <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 0.5, display: 'block' }}>From</Typography>
                                <DatePicker
                                    value={parseISO(filters.fromDate)}
                                    onChange={(v) => setFilters({ ...filters, fromDate: format(v, 'yyyy-MM-dd') })}
                                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                />
                            </Box>

                            {/* To Date - Fixed Width */}
                            <Box sx={{ width: '180px' }}>
                                <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 0.5, display: 'block' }}>To</Typography>
                                <DatePicker
                                    value={parseISO(filters.toDate)}
                                    onChange={(v) => setFilters({ ...filters, toDate: format(v, 'yyyy-MM-dd') })}
                                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                />
                            </Box>

                            {/* City - Responsive but smaller flex */}
                            <TextField select label="City" size="small" value={filters.city_id} onChange={(e) => setFilters({ ...filters, city_id: e.target.value })} sx={{ flex: 0.8, minWidth: '100px' }}>
                                <MenuItem value="">All</MenuItem>
                                {cities.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                            </TextField>

                            {/* Store */}
                            <TextField select label="Store" size="small" value={filters.store_id} onChange={(e) => setFilters({ ...filters, store_id: e.target.value })} sx={{ flex: 1, minWidth: '120px' }}>
                                <MenuItem value="">All</MenuItem>
                                {stores.map(s => <MenuItem key={s.id} value={s.id}>{s.store_name}</MenuItem>)}
                            </TextField>

                            {/* BA Name */}
                            <TextField select label="BA Name" size="small" value={filters.ba_id} onChange={(e) => setFilters({ ...filters, ba_id: e.target.value })} sx={{ flex: 1, minWidth: '130px' }}>
                                <MenuItem value="">All</MenuItem>
                                {users.map(u => <MenuItem key={u.id} value={u.id}>{u.fullname || u.name}</MenuItem>)}
                            </TextField>
                        </Box>

                        {/* ROW 2: Product Filters + Generate Button */}
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                            <TextField select label="Category" size="small" value={filters.cat_id} onChange={(e) => setFilters({ ...filters, cat_id: e.target.value })} sx={{ flex: 1 }}>
                                <MenuItem value="">All</MenuItem>
                                {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.category_name}</MenuItem>)}
                            </TextField>

                            <TextField select label="Sub-Category" size="small" value={filters.subcat_id} onChange={(e) => setFilters({ ...filters, subcat_id: e.target.value })} disabled={!filters.cat_id} sx={{ flex: 1 }}>
                                <MenuItem value="">All</MenuItem>
                                {subCategories.map(sc => <MenuItem key={sc.id} value={sc.id}>{sc.subcategory_name}</MenuItem>)}
                            </TextField>

                            {/* Item - Isay thora bara rakha hai kyunki product names bare hote hain */}
                            {/* Select Item Dropdown update karein */}
                            {/* Item - Isay thora bara rakha hai kyunki product names bare hote hain */}
                            <TextField
                                select
                                label="Select Item"
                                size="small"
                                value={filters.item_id}
                                onChange={(e) => setFilters({ ...filters, item_id: e.target.value })}
                                sx={{ flex: 2 }}
                            >
                                <MenuItem value="">All Items</MenuItem>

                                {/* 👇 Yahan filter apply hoga map se pehle */}
                                {itemsList
                                    .filter(i => {
                                        // Category match: Agar filter khali hai toh true, warna ID match karo
                                        const catMatch = !filters.cat_id || String(i.category_id) === String(filters.cat_id);

                                        // Sub-Category match: Yahan hum multiple keys check kar rahe hain safe side ke liye
                                        const itemSubId = i.subcategory_id || i.sub_category_id || i.subcat_id;
                                        const subCatMatch = !filters.subcat_id || String(itemSubId) === String(filters.subcat_id);

                                        return catMatch && subCatMatch;
                                    })
                                    .map(i => (
                                        <MenuItem key={i.id} value={i.id}>
                                            {i.product_name}
                                        </MenuItem>
                                    ))
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
                                disabled={loading || reportData.data.length === 0}
                                startIcon={<FileDownload />}
                                sx={{ height: '40px', fontWeight: 'bold', ml: 1 }}
                            >
                                Export
                            </Button>
                        </Box>
                    </LocalizationProvider>
                </Paper>

                <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 250px)', borderRadius: 2 }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                {["Date", "City", "Store", "BA Name", "Cat", "Sub Cat", "Item", "MRP", "Qty", "Value"].map(h => (
                                    <TableCell key={h} align="center" sx={{ bgcolor: '#1b2142', color: 'white', fontWeight: 'bold', fontSize: '12px', py: 1 }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={10} align="center" sx={{ py: 8 }}><CircularProgress color="secondary" /></TableCell></TableRow>
                            ) : reportData.data?.length > 0 ? (
                                reportData.data.map((transaction) => (
                                    <React.Fragment key={transaction.saleId}>
                                        {/* Item Rows for this Transaction */}
                                        {transaction.items.map((item, idx) => (
                                            <TableRow key={`${transaction.saleId}-${idx}`} sx={{ '& td': { fontSize: '11px', borderBottom: '1px solid #f0f0f0' } }}>
                                                <TableCell align="center">{transaction.date}</TableCell>
                                                <TableCell align="center">{transaction.city}</TableCell>
                                                <TableCell align="center">{transaction.store}</TableCell>
                                                <TableCell align="center">{transaction.baName}</TableCell>
                                                <TableCell align="center">{item.cat}</TableCell>
                                                <TableCell align="center">{item.subCat}</TableCell>
                                                <TableCell align="left" sx={{ maxWidth: 200 }}>{item.itemName}</TableCell>
                                                <TableCell align="center">{Math.round(item.rp).toLocaleString()}</TableCell>
                                                <TableCell align="center">{item.qty}</TableCell>
                                                <TableCell align="center">{item.value.toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                        {/* SUB-TOTAL ROW FOR THIS TRANSACTION */}
                                        <TableRow sx={{ bgcolor: '#cccbcbff' }}>
                                            <TableCell colSpan={8} align="right" sx={{ fontWeight: 'bold', fontSize: '11px', color: '#555' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                                    <ReceiptLong fontSize="small" /> Transaction Total :
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 'bold', color: '#ab1d47', bgcolor: '#cccbcbff' }}>{transaction.subTotalQty}</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 'bold', color: '#ab1d47', bgcolor: '#cccbcbff' }}>{transaction.subTotalAmount.toLocaleString()}</TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={10} align="center" sx={{ py: 4, color: '#999' }}>No data available.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </>
    );
};

export default SalesReport;