import React, { useEffect, useState } from 'react';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
import {
    Dialog, DialogContent, DialogTitle, IconButton,
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Button, CircularProgress, MenuItem
} from '@mui/material';
import { Close, Inventory, FilterAlt, FileDownload } from '@mui/icons-material';
import API from '../api/API';
import { handleExportToExcel } from '../utils/exportUtils';

const ExpiryStockReport = () => {
    const [openModal, setOpenModal] = useState(false);
    const [previewImage, setPreviewImage] = useState('');



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

    // Initial Data Fetch
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
            } catch (err) { console.error("Initial Fetch Error:", err); }
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
        // Logic: Reset subcat and item when category changes to prevent invalid filters
        setFilters(prev => ({ ...prev, subcategory_id: '', item_id: '' }));
    }, [filters.category_id]);



    const handleImageClick = (imgUrl) => {
        setPreviewImage(imgUrl);
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setPreviewImage('');
    };


    const handleGenerateReport = async () => {
        setLoading(true);
        const cleanFilters = Object.fromEntries(
            Object.entries(filters).filter(([_, v]) => v !== "" && v !== null)
        );
        try {
            const res = await API.get(`/reports/expiry-report`, { params: cleanFilters });
            setReportData(res.data.data || []);
        } catch (err) {
            alert("Report fetch failed!");
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
            "Report Date": formatDateDisplay(row.date),
            "Channel": row.channelName,
            "City": row.cityName,
            "Store": row.storeName,
            "BA Name": row.baName,
            "Category": row.categoryName,
            "Item Name": row.itemName,
            "Expiry Date": formatDateDisplay(row.expiryDate),
            "Quantity": row.quantity
        }));
        handleExportToExcel(rowsForExcel, "Expiry_Stock_Report");
    };

    return (
        <Box sx={{ p: 1.5, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <Inventory sx={{ mr: 1, color: '#ab1d47' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1b2142' }}>Expiry Stock Report</Typography>
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
                                slotProps={{ textField: { size: 'small', fullWidth: true, 'aria-label': 'Filter by From Date' } }}
                            />
                        </Box>
                        <Box sx={{ width: '150px' }}>
                            <DatePicker
                                label="To"
                                value={parseISO(filters.toDate)}
                                onChange={(v) => setFilters({ ...filters, toDate: format(v, 'yyyy-MM-dd') })}
                                slotProps={{ textField: { size: 'small', fullWidth: true, 'aria-label': 'Filter by To Date' } }}
                            />
                        </Box>

                        <TextField select label="City" size="small" value={filters.city_id}
                            onChange={(e) => setFilters({ ...filters, city_id: e.target.value, store_id: '' })} sx={{ flex: 1 }}>
                            <MenuItem value="">All Cities</MenuItem>
                            {cities.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                        </TextField>

                        <TextField select label="Channel" size="small" value={filters.channel_id}
                            onChange={(e) => setFilters({ ...filters, channel_id: e.target.value })} sx={{ flex: 1 }}>
                            <MenuItem value="">All Channels</MenuItem>
                            {channels.map(ch => <MenuItem key={ch.id} value={ch.id}>{ch.name}</MenuItem>)}
                        </TextField>

                        <TextField select label="Store" size="small" value={filters.store_id}
                            onChange={(e) => setFilters({ ...filters, store_id: e.target.value })} sx={{ flex: 1.2 }}>
                            <MenuItem value="">All Stores</MenuItem>
                            {stores.filter(s => !filters.city_id || String(s.city_id) === String(filters.city_id)).map(s => (
                                <MenuItem key={s.id} value={s.id}>{s.store_name} {s.area ? `(${s.area})` : ''}</MenuItem>
                            ))}
                        </TextField>

                        <TextField select label="BA Name" size="small" value={filters.ba_user_id}
                            onChange={(e) => setFilters({ ...filters, ba_user_id: e.target.value })} sx={{ flex: 1 }}>
                            <MenuItem value="">All BAs</MenuItem>
                            {users.map(u => <MenuItem key={u.id} value={u.id}>{u.fullname || u.name}</MenuItem>)}
                        </TextField>
                    </Box>

                    {/* ROW 2: Product Filters & Actions */}
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <TextField select label="Category" size="small" value={filters.category_id}
                            onChange={(e) => setFilters({ ...filters, category_id: e.target.value })} sx={{ flex: 1 }}>
                            <MenuItem value="">All Categories</MenuItem>
                            {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.category_name}</MenuItem>)}
                        </TextField>

                        <TextField select label="Sub-Category" size="small" value={filters.subcategory_id}
                            onChange={(e) => setFilters({ ...filters, subcategory_id: e.target.value })}
                            disabled={!filters.category_id} sx={{ flex: 1 }}>
                            <MenuItem value="">All Sub-Categories</MenuItem>
                            {subCategories.map(sc => <MenuItem key={sc.id} value={sc.id}>{sc.subcategory_name}</MenuItem>)}
                        </TextField>

                        <TextField select label="Select Item" size="small" value={filters.item_id}
                            onChange={(e) => setFilters({ ...filters, item_id: e.target.value })} sx={{ flex: 1.5 }}>
                            <MenuItem value="">All Items</MenuItem>
                            {itemsList
                                .filter(i => (!filters.category_id || String(i.category_id) === String(filters.category_id)) &&
                                    (!filters.subcategory_id || String(i.subcategory_id) === String(filters.subcategory_id)))
                                .map(i => <MenuItem key={i.id} value={i.id}>{i.product_name}</MenuItem>)
                            }
                        </TextField>

                        <Button
                            variant="contained"
                            onClick={handleGenerateReport}
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FilterAlt />}
                            sx={{ bgcolor: '#ab1d47', fontWeight: 'bold', minWidth: '130px' }}
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
                <Table stickyHeader size="small" aria-label="Expiry stock list">
                    <TableHead>
                        <TableRow>
                            {["Date", "Channel", "City", "Store", "BA Name", "Category", "Item Name", "Expiry Date", "Qty", "Item Img"].map(h => (
                                <TableCell key={h} align="center" sx={{ bgcolor: '#1b2142', color: 'white', fontWeight: 'bold', fontSize: '12px' }}>{h}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={10} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
                        ) : reportData.length > 0 ? (
                            reportData.map((row, idx) => (
                                <TableRow key={idx} hover sx={{ '& td': { fontSize: '11px' } }}>
                                    <TableCell align="center">{formatDateDisplay(row.date)}</TableCell>
                                    <TableCell align="center">{row.channelName || 'N/A'}</TableCell>
                                    <TableCell align="center">{row.cityName}</TableCell>
                                    <TableCell align="center">{row.storeName}</TableCell>
                                    <TableCell align="center">{row.baName}</TableCell>
                                    <TableCell align="center">{row.categoryName}</TableCell>
                                    <TableCell align="left" sx={{ color: '#ab1d47', fontWeight: 'bold' }}>{row.itemName}</TableCell>
                                    <TableCell align="center" sx={{ color: 'red', fontWeight: 'bold' }}>{formatDateDisplay(row.expiryDate)}</TableCell>
                                    <TableCell align="center">{row.quantity}</TableCell>
                                    <TableCell align="center">
                                        {row.picture ? (
                                            <Box
                                                component="img"
                                                src={row.picture}
                                                alt={`Verification for ${row.itemName}`}
                                                onClick={() => handleImageClick(row.picture)}
                                                sx={{
                                                    width: '35px',
                                                    height: '35px',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    transition: 'transform 0.2s',
                                                    '&:hover': { transform: 'scale(1.2)', border: '1px solid #ab1d47' }
                                                }}
                                            />
                                        ) : 'N/A'}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={10} align="center" sx={{ py: 4, color: '#999' }}>No expiry stock found.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>


            {/* FULL IMAGE PREVIEW MODAL */}
            {/* FULL IMAGE PREVIEW MODAL */}
            <Dialog
                open={openModal}
                onClose={handleCloseModal}
                // maxWidth={false} // Default width overrides ko band karne ke liye
                PaperProps={{
                    sx: {
                        width: '600px',      // Fixed Width
                        height: '650px',     // Fixed Height (Header include karke)
                        borderRadius: 3,
                        overflow: 'hidden'
                    }
                }}
                aria-labelledby="image-preview-dialog"
            >
                <DialogTitle id="image-preview-dialog" sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: '#1b2142',
                    color: 'white',
                    p: 1.5
                }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', ml: 1 }}>
                        Visual Verification Preview
                    </Typography>
                    <IconButton onClick={handleCloseModal} sx={{ color: 'white' }}>
                        <Close />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{
                    p: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    bgcolor: '#000', // Dark background taake focus image par rahe
                    height: '100%',
                    width: '100%'
                }}>
                    <Box
                        component="img"
                        src={previewImage}
                        alt="Full Preview"
                        sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain', // CRITICAL: Ratio kharab nahi hoga, image box mein fit hogi
                            p: 1
                        }}
                    />
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default ExpiryStockReport;