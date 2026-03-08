import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Pagination, IconButton, Button,
  CircularProgress, Stack, Dialog, DialogTitle, DialogContent,
  DialogActions, MenuItem, Grid, InputAdornment
} from '@mui/material';
import { Edit, Delete, Add, Search, Visibility } from '@mui/icons-material';
import API from '../api/API';

const ItemsMaster = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('add');
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({
    item_code: '',
    product_name: '',
    category_id: '',
    subcategory_id: '',
    retail_price: '',
    discount: 0
  });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get(`/items?page=${page}&limit=10&search=${search}`);
      setItems(res.data.items || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) { console.error("Fetch Items Error:", err); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await API.get('/category');
        const uniqueCats = Array.from(new Map(res.data.map(item => [item.id, item])).values());
        setCategories(uniqueCats);
      } catch (err) { console.error("Category Load Error:", err); }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchSubs = async () => {
      if (formData.category_id) {
        try {
          const res = await API.get(`/subCategory/${formData.category_id}`);
          setSubCategories(res.data || []);
        } catch (err) { console.error("SubCategory Load Error:", err); }
      } else {
        setSubCategories([]);
      }
    };
    fetchSubs();
  }, [formData.category_id]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

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
        discount: item.discount || 0
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

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#1b2142' }}>
        Item Management
      </Typography>

      <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}>
        <Paper sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 400 }}>
          <Search sx={{ p: 1, color: 'gray' }} />
          <TextField
            fullWidth size="small" variant="standard"
            placeholder="Search Product or Code..."
            InputProps={{ disableUnderline: true }}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </Paper>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen('add')} sx={{ bgcolor: '#ab1d47', '&:hover': { bgcolor: '#8e183a' } }}>
          Create Item
        </Button>
      </Stack>

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#1b2142' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Item Code</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Item Name</TableCell>
              {/* ALAG ALAG COLUMNS */}
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Category</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Sub-Cat</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>RP</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Dis %</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Net Price</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} align="center"><CircularProgress size={30} /></TableCell></TableRow>
            ) : items.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell sx={{ fontWeight: 'bold', color: '#ab1d47' }}>{item.item_code}</TableCell>
                <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.product_name}
                </TableCell>
                <TableCell>{item.category?.category_name || '-'}</TableCell>
                <TableCell>{item.subcategory?.subcategory_name || '-'}</TableCell>
                <TableCell>{parseFloat(item.retail_price).toLocaleString()}</TableCell>
                <TableCell>{item.discount}%</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'green' }}>
                  {parseFloat(item.price_after_discount).toLocaleString()}
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <IconButton size="small" color="info" onClick={() => handleOpen('view', item)}><Visibility fontSize="inherit" /></IconButton>
                    <IconButton size="small" color="primary" onClick={() => handleOpen('edit', item)}><Edit fontSize="inherit" /></IconButton>
                    <IconButton size="small" color="error"><Delete fontSize="inherit" /></IconButton>
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

      {/* DIALOG REMAINS SAME */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1b2142', color: 'white' }}>
          {mode === 'add' ? 'Add Item' : mode === 'edit' ? 'Edit Item' : 'Item Details'}
        </DialogTitle>
        <DialogContent dividers>
          {/* ROW 1: Item Code & Item Name */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Item Code</Typography>
              <TextField
                fullWidth size="small" placeholder="E.g. ITM-001"
                disabled={mode === 'view'}
                value={formData.item_code}
                onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
              />
            </Box>
            <Box sx={{ flex: 2 }}> {/* Product name ko thodi zyada space di hai */}
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Item Name</Typography>
              <TextField
                fullWidth size="small" placeholder="Enter product name"
                disabled={mode === 'view'}
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
              />
            </Box>
          </Box>

          {/* ROW 2: Category & Sub-Category */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Category</Typography>
              <TextField
                select fullWidth size="small"
                disabled={mode === 'view'}
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value, subcategory_id: '' })}
              >
                {categories.map(cat => <MenuItem key={cat.id} value={cat.id}>{cat.category_name}</MenuItem>)}
              </TextField>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Sub-Category</Typography>
              <TextField
                select fullWidth size="small"
                disabled={mode === 'view' || !formData.category_id}
                value={formData.subcategory_id}
                onChange={(e) => setFormData({ ...formData, subcategory_id: e.target.value })}
              >
                {subCategories.map(sub => <MenuItem key={sub.id} value={sub.id}>{sub.subcategory_name}</MenuItem>)}
              </TextField>
            </Box>
          </Box>

          {/* ROW 3: Retail Price & Discount */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Retail Price (RP)</Typography>
              <TextField
                fullWidth size="small" type="number"
                placeholder="0.00"
                disabled={mode === 'view'}
                value={formData.retail_price}
                onChange={(e) => setFormData({ ...formData, retail_price: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Discount (%)</Typography>
              <TextField
                fullWidth size="small" type="number"
                placeholder="0"
                disabled={mode === 'view'}
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
              />
            </Box>
          </Box>

          {/* ROW 4: Net Price Highlight Section */}
          <Box sx={{
            bgcolor: '#f8f9fa',
            p: 2,
            borderRadius: 1,
            borderLeft: '5px solid #ab1d47',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1b2142' }}>
              Net Price
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#ab1d47' }}>
              Rs. {parseFloat(formData.retail_price - (formData.retail_price * (formData.discount / 100)) || 0).toLocaleString()}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)} color="inherit">Cancel</Button>
          {mode !== 'view' && <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#ab1d47' }}>Save</Button>}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ItemsMaster;