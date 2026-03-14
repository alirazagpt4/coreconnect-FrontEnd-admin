import React, { useEffect, useState, useCallback, useContext } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Pagination, IconButton, Button,
  CircularProgress, Stack, Dialog, DialogTitle, DialogContent,
  DialogActions, MenuItem, Grid, InputAdornment, Tooltip
} from '@mui/material';
import { Edit, Delete, Add, Search, Visibility, FilterAltOff } from '@mui/icons-material';
import API from '../api/API';
import { AuthContext } from '../context/AuthContext';

const ItemsMaster = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  // context 
  const { user } = useContext(AuthContext);
  const userRole = user?.role;

  // --- Filter States ---
  const [filterCat, setFilterCat] = useState('');
  const [filterSubCat, setFilterSubCat] = useState('');
  const [filterItemId, setFilterItemId] = useState('');
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]); // For Modal
  const [filterSubCategories, setFilterSubCategories] = useState([]); // For Top Filter
  const [allItemsList, setAllItemsList] = useState([]); // For Item Dropdown filter

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState(null);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('add');
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({
    item_code: '', product_name: '', category_id: '', subcategory_id: '', retail_price: '', discount: 0
  });

  // 1. Fetch Items with all filters
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 25,
        search,
        category_id: filterCat,
        subcategory_id: filterSubCat,
        item_id: filterItemId
      });
      const res = await API.get(`/items?${params.toString()}`);
      setItems(res.data.items || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) { console.error("Fetch Items Error:", err); }
    finally { setLoading(false); }
  }, [page, search, filterCat, filterSubCat, filterItemId]);

  // 2. Initial Data Load (Categories & All Items for dropdown)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [catRes, itemRes] = await Promise.all([
          API.get('/category'),
          API.get('/items?limit=1000') // Saare items dropdown ke liye
        ]);
        setCategories(catRes.data || []);
        setAllItemsList(itemRes.data.items || []);
      } catch (err) { console.error("Initial Load Error:", err); }
    };
    fetchInitialData();
  }, []);

  // 3. Sub-Category logic for TOP FILTER
  useEffect(() => {
    if (filterCat) {
      API.get(`/subCategory/${filterCat}`).then(res => setFilterSubCategories(res.data || []));
    } else {
      setFilterSubCategories([]);
    }
  }, [filterCat]);

  // 4. Sub-Category logic for MODAL
  useEffect(() => {
    if (formData.category_id) {
      API.get(`/subCategory/${formData.category_id}`).then(res => setSubCategories(res.data || []));
    } else {
      setSubCategories([]);
    }
  }, [formData.category_id]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const resetFilters = () => {
    setFilterCat('');
    setFilterSubCat('');
    setFilterItemId('');
    setSearch('');
    setPage(1);
  };

  const handleOpen = (type, item = null) => {
    setMode(type);
    if (item) {
      setSelectedId(item.id);
      setFormData({
        item_code: item.item_code || '',
        product_name: item.product_name || '',
        category_id: item.category_id || '',
        subcategory_id: item.subcategory_id || '',
        retail_price: item.retail_price || '',
        discount: item.discount || 0,
        is_active: item.is_active
      });
    } else {
      setFormData({ item_code: '', product_name: '', category_id: '', subcategory_id: '', retail_price: '', discount: 0 });
    }
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (mode === 'view') { setOpen(false); return; }
    try {
      if (mode === 'edit') {
        await API.patch(`/items/${selectedId}`, formData);
      } else {
        await API.post('/items/create-item', formData);
      }
      setOpen(false);
      fetchItems();
    } catch (err) { alert("Operation failed!"); }
  };

  const confirmStatusToggle = (id) => {
    setPendingStatusUpdate(id);
    setStatusDialogOpen(true);
  };

  const processStatusToggle = async () => {
    if (pendingStatusUpdate) {
      try {
        const res = await API.patch('/status/toggle-status', { modelName: 'ItemMaster', id: pendingStatusUpdate });
        if (res.data.success) {
          setItems(prev => prev.map(item => item.id === pendingStatusUpdate ? { ...item, is_active: res.data.is_active } : item));
        }
      } catch (err) { alert("Update failed"); }
      setStatusDialogOpen(false);
      setPendingStatusUpdate(null);
    }
  };


  const displayItems = allItemsList.filter(item => {
    const matchCat = filterCat ? item.category_id === parseInt(filterCat) : true;
    const matchSubCat = filterSubCat ? item.subcategory_id === parseInt(filterSubCat) : true;
    return matchCat && matchSubCat;
  });

  return (
    <>

      <Box>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#1b2142' }}>
          Product List
        </Typography>

        <Paper sx={{ p: 2, mb: 3, borderRadius: 2, boxShadow: 1, bgcolor: '#fdfdfd' }}>
          <Stack spacing={2}>

            {/* ROW 1: Search, Category, Sub-Category */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {/* Search Field */}
              <TextField
                sx={{ flex: 2 }} size="small" placeholder="Search Product or Code..."
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                InputProps={{ startAdornment: (<InputAdornment position="start"><Search fontSize="small" /></InputAdornment>) }}
              />

              {/* Category Filter */}
              <TextField
                select sx={{ flex: 1 }} size="small" label="Category"
                value={filterCat}
                onChange={(e) => {
                  setFilterCat(e.target.value);
                  setFilterSubCat('');
                  setFilterItemId(''); // Item reset karna zaroori hai jab category badle
                  setPage(1);
                }}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map(cat => <MenuItem key={cat.id} value={cat.id}>{cat.category_name}</MenuItem>)}
              </TextField>

              {/* Sub-Category Filter */}
              <TextField
                select sx={{ flex: 1 }} size="small" label="Sub-Category"
                value={filterSubCat}
                disabled={!filterCat}
                onChange={(e) => {
                  setFilterSubCat(e.target.value);
                  setFilterItemId(''); // Item reset
                  setPage(1);
                }}
              >
                <MenuItem value="">All Sub-Cats</MenuItem>
                {filterSubCategories.map(sub => <MenuItem key={sub.id} value={sub.id}>{sub.subcategory_name}</MenuItem>)}
              </TextField>
            </Box>

            {/* ROW 2: Specific Item, Reset, Create */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                select sx={{ flex: 2 }} size="small" label="Specific Item"
                value={filterItemId}
                onChange={(e) => { setFilterItemId(e.target.value); setPage(1); }}
              >
                <MenuItem value="">All Items</MenuItem>
                {/* Yahan hum filtered list (displayItems) use kar rahe hain */}
                {displayItems.map(item => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.product_name} ({item.item_code})
                  </MenuItem>
                ))}
              </TextField>

              <Box sx={{ display: 'flex', gap: 1, flex: 1, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined" color="inherit" onClick={resetFilters}
                  startIcon={<FilterAltOff />} sx={{ textTransform: 'none', height: '40px' }}
                >
                  Reset
                </Button>

                {(userRole === 'admin' || userRole === 'ccadmin') && (
                  <Button
                    variant="contained" startIcon={<Add />} onClick={() => handleOpen('add')}
                    sx={{ bgcolor: '#ab1d47', '&:hover': { bgcolor: '#8e183a' }, textTransform: 'none', px: 4, height: '40px' }}
                  >
                    Create Item
                  </Button>
                )}
              </Box>
            </Box>

          </Stack>
        </Paper>

        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#1b2142' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Category</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Sub-Cat</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Item Name</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>MRP</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Dis %</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Net Price</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center"><CircularProgress size={30} /></TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center">No Items Found</TableCell></TableRow>
              ) : items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.category?.category_name || '-'}</TableCell>
                  <TableCell>{item.subcategory?.subcategory_name || '-'}</TableCell>
                  <TableCell sx={{ maxWidth: 250, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.product_name}
                  </TableCell>
                  <TableCell>{parseFloat(item.retail_price).toLocaleString()}</TableCell>
                  <TableCell>{item.discount}%</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'green' }}>
                    {parseFloat(item.price_after_discount).toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <IconButton
                      size="small"
                      onClick={() => confirmStatusToggle(item.id)}
                      sx={{
                        color: item.is_active ? '#28a745' : '#dc3545',
                        border: '1px solid',
                        borderColor: item.is_active ? '#28a745' : '#dc3545',
                        borderRadius: '4px', width: '28px', height: '28px'
                      }}
                    >
                      {item.is_active ? '✓' : '✗'}
                    </IconButton>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <IconButton size="small" color="info" onClick={() => handleOpen('view', item)}><Visibility fontSize="inherit" /></IconButton>
                      {(userRole === 'admin' || userRole === 'ccadmin') && (
                        <>
                          <IconButton size="small" color="primary" onClick={() => handleOpen('edit', item)}><Edit fontSize="inherit" /></IconButton>
                          {(userRole === 'admin') && (
                            <IconButton size="small" color="error"><Delete fontSize="inherit" /></IconButton>
                          )}
                        </>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack alignItems="center" sx={{ mt: 3 }}>
          <Pagination count={totalPages} page={page} onChange={(e, v) => setPage(v)} color="primary" />
        </Stack>

        {/* --- MODAL (ADD/EDIT/VIEW) --- */}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ bgcolor: '#1b2142', color: 'white' }}>
            {mode === 'add' ? 'Add Item' : mode === 'edit' ? 'Edit Item' : 'Item Details'}
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Item Code</Typography>
                <TextField fullWidth size="small" disabled={mode === 'view'} value={formData.item_code} onChange={(e) => setFormData({ ...formData, item_code: e.target.value })} />
              </Grid>
              <Grid item xs={8}>
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Item Name</Typography>
                <TextField fullWidth size="small" disabled={mode === 'view'} value={formData.product_name} onChange={(e) => setFormData({ ...formData, product_name: e.target.value })} />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Category</Typography>
                <TextField select fullWidth size="small" disabled={mode === 'view'} value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value, subcategory_id: '' })}>
                  {categories.map(cat => <MenuItem key={cat.id} value={cat.id}>{cat.category_name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Sub-Category</Typography>
                <TextField select fullWidth size="small" disabled={mode === 'view' || !formData.category_id} value={formData.subcategory_id} onChange={(e) => setFormData({ ...formData, subcategory_id: e.target.value })}>
                  {subCategories.map(sub => <MenuItem key={sub.id} value={sub.id}>{sub.subcategory_name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Retail Price</Typography>
                <TextField fullWidth size="small" type="number" disabled={mode === 'view'} value={formData.retail_price} onChange={(e) => setFormData({ ...formData, retail_price: e.target.value })} />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Discount (%)</Typography>
                <TextField fullWidth size="small" type="number" disabled={mode === 'view'} value={formData.discount} onChange={(e) => setFormData({ ...formData, discount: e.target.value })} />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, bgcolor: '#f8f9fa', p: 2, borderRadius: 1, borderLeft: '5px solid #ab1d47', display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Net Price</Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#ab1d47' }}>
                Rs. {parseFloat(formData.retail_price - (formData.retail_price * (formData.discount / 100)) || 0).toLocaleString()}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpen(false)} color="inherit">Cancel</Button>
            {mode !== 'view' && <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#ab1d47' }}>Save Item</Button>}
          </DialogActions>
        </Dialog>

        {/* --- STATUS DIALOG --- */}
        <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
          <DialogTitle>Confirm Status Change</DialogTitle>
          <DialogContent><Typography>Are you sure you want to toggle this item's status?</Typography></DialogContent>
          <DialogActions>
            <Button onClick={() => setStatusDialogOpen(false)}>No</Button>
            <Button onClick={processStatusToggle} variant="contained" sx={{ bgcolor: '#ab1d47' }}>Yes, Update</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};

export default ItemsMaster;