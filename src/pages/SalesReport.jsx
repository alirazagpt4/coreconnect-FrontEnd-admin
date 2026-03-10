import React, { useEffect, useState } from 'react';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Button, CircularProgress, MenuItem, Divider
} from '@mui/material';
import { Assessment, FilterAlt, ReceiptLong } from '@mui/icons-material';
import API from '../api/API';

const SalesReport = () => {
    const [reportData, setReportData] = useState({ summary: {}, data: [] });
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
            setReportData(res.data); // Pure object ko set kar rahe hain (summary + data)
        } catch (err) { alert("Data fetch nahi ho saka!"); }
        finally { setLoading(false); }
    };

    const filterBoxStyle = { flex: 1, minWidth: '120px' };
    const dateBoxStyle = { flex: 0.6, minWidth: '100px' };

    return (
        <Box sx={{ p: 1.5, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Assessment sx={{ mr: 1, color: '#ab1d47' }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1b2142' }}>Daily Sales Report</Typography>
                </Box>

                {/* GRAND TOTAL SUMMARY HEADER */}
                {reportData.summary.totalTransactions > 0 && (
                    <Paper sx={{ display: 'flex', gap: 3, p: 1, px: 3, bgcolor: '#1b2142', color: 'white', borderRadius: 2 }}>
                        <Box><Typography variant="caption">Transactions</Typography><Typography variant="body2" sx={{ fontWeight: 'bold' }}>{reportData.summary.totalTransactions}</Typography></Box>
                        <Divider orientation="vertical" flexItem sx={{ bgcolor: '#444' }} />
                        <Box><Typography variant="caption">Sold Qty</Typography><Typography variant="body2" sx={{ fontWeight: 'bold' }}>{reportData.summary.grandTotalQty?.toLocaleString()}</Typography></Box>
                        <Divider orientation="vertical" flexItem sx={{ bgcolor: '#444' }} />
                        <Box><Typography variant="caption">Total Value</Typography><Typography variant="body2" sx={{ fontWeight: 'bold', color: '#4caf50' }}>Rs. {Math.round(reportData.summary.grandTotalAmount).toLocaleString()}</Typography></Box>
                    </Paper>
                )}
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
                        <TextField select label="Select Item" size="small" value={filters.item_id} onChange={(e) => setFilters({ ...filters, item_id: e.target.value })} sx={{ flex: 2 }}>
                            <MenuItem value="">All Items</MenuItem>
                            {itemsList.map(i => <MenuItem key={i.id} value={i.id}>{i.product_name}</MenuItem>)}
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
    );
};

export default SalesReport;