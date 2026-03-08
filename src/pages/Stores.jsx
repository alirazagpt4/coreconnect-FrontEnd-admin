import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Pagination, IconButton, Button,
  CircularProgress, Stack, Dialog, DialogTitle, DialogContent,
  DialogActions, MenuItem, Grid, Tooltip, Divider, InputAdornment
} from '@mui/material';
import { Edit, Delete, Add, Search, Visibility, Store as StoreIcon, Person, Phone, LocationCity } from '@mui/icons-material';
import API from '../api/API'; // Yeh baseURL/api tak set hai

const Stores = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  // Dropdown States
  const [cities, setCities] = useState([]);
  const [regions, setRegions] = useState([]);
  const [users, setUsers] = useState([]); // For Beauty Advisors

  // Dialog Control
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('add');
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({
    store_name: '',
    area: '',
    city_id: '',
    region_id: '',
    ba_user_id: '',
    targets: ''

  });

  // 1. Fetch Stores Data
  const fetchStores = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get(`/store?page=${page}&limit=10&search=${search}`);
      setStores(res.data.stores || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) { console.error("Fetch Error:", err); }
    finally { setLoading(false); }
  }, [page, search]);


  // 2. Fetch Dropdowns (Cities, Regions, Users)
  useEffect(() => {
    let isMounted = true; // Memory leak aur double set se bachne ke liye

    const fetchDropdowns = async () => {
      try {
        const [c, r, u] = await Promise.all([
          API.get('/cities'),
          API.get('/regions'),
          API.get('/users?limit=1000')
        ]);

        // Name ke hisab se unique karna (Sab se safest tarika)
        const getUniqueByName = (data) => {
          if (!data) return [];
          const seen = new Set();
          return data.filter(item => {
            const duplicate = seen.has(item.name.toLowerCase().trim());
            seen.add(item.name.toLowerCase().trim());
            return !duplicate;
          });
        };

        setCities(getUniqueByName(c.data));
        setRegions(getUniqueByName(r.data));
        setUsers(u.data.users ? u.data.users.filter(user => user.role === 'user') : []);

      } catch (err) {
        console.error("Dropdown Load Error:", err);
      }
    };
    fetchDropdowns();

    return () => {
      isMounted = false; // Cleanup function
    };
  }, []); // Empty dependency array taake sirf mount par chale

  useEffect(() => { fetchStores(); }, [fetchStores]);

  // 3. Handlers
  const handleOpen = (type, store = null) => {
    setMode(type);
    if (store) {
      setSelectedId(store.id);
      setFormData({
        store_name: store.store_name || '',
        area: store.area || '',
        city_id: store.city_id || '',
        region_id: store.region_id || '',
        ba_user_id: store.ba_user_id || '',
        targets: store.targets || ''


      });
    } else {
      setFormData({ store_name: '', area: '', city_id: '', region_id: '', ba_user_id: '', targets: '' });
    }
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (mode === 'view') { setOpen(false); return; }
    try {
      if (mode === 'edit') {
        await API.patch(`/store/${selectedId}`, formData);
      } else {
        await API.post('/store/create-store', formData);
      }
      setOpen(false);
      fetchStores();
    } catch (err) { alert("Action Failed! Check console."); }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#1b2142' }}>
        Store Management
      </Typography>

      <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}>
        <Paper sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 400 }}>
          <Search sx={{ p: 1, color: 'gray' }} />
          <TextField
            fullWidth size="small" variant="standard"
            placeholder="Search by store name..."
            InputProps={{ disableUnderline: true }}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </Paper>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen('add')} sx={{ bgcolor: '#ab1d47', '&:hover': { bgcolor: '#8e183a' } }}>
          Add New Store
        </Button>
      </Stack>

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3, overflow: 'hidden' }}>
        <Table size="small"> {/* 👈 Size small karne se row ki height kam ho jayegi */}
          <TableHead sx={{ bgcolor: '#1b2142' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 1 }}>Store Name</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 1 }}>City</TableCell> {/* City bhi add kar di */}
              <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 1 }}>Area</TableCell> {/* 👈 Area Field Added */}
              {/* <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 1 }}>Manager</TableCell> */}
              <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 1 }}>Target</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 1 }}>BA Assigned</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center', py: 1 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}><CircularProgress size={25} /></TableCell></TableRow>
            ) : stores.map((s) => (
              <TableRow key={s.id} hover sx={{ '& td': { py: 0.5 } }}> {/* 👈 mazeed compact padding */}
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>{s.store_name}</TableCell>
                <TableCell sx={{ fontSize: '0.875rem' }}>{s.city?.name || '-'}</TableCell>
                <TableCell sx={{ fontSize: '0.875rem' }}>{s.area || '-'}</TableCell> {/* 👈 Area Data */}
                {/* <TableCell sx={{ fontSize: '0.875rem' }}>{s.store_manager_name || '-'}</TableCell> */}
                <TableCell sx={{ fontSize: '0.875rem' }}>
                  {s.targets ? `Rs. ${parseFloat(s.targets).toLocaleString()}` : '0'}
                </TableCell>
                <TableCell sx={{ fontSize: '0.875rem' }}>
                  <Typography variant="caption" sx={{
                    bgcolor: s.beauty_advisor ? '#e3f2fd' : '#f5f5f5',
                    color: s.beauty_advisor ? '#1976d2' : '#757575',
                    px: 1, borderRadius: 1, fontWeight: 'bold'
                  }}>
                    {s.beauty_advisor?.name || 'Unassigned'}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Tooltip title="View"><IconButton size="small" color="info" onClick={() => handleOpen('view', s)}><Visibility sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                    <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => handleOpen('edit', s)}><Edit sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" color="error"><Delete sx={{ fontSize: 18 }} /></IconButton></Tooltip>
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

      {/* MASTER DIALOG */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1b2142', color: 'white' }}>
          {mode === 'add' ? 'Create New Store' : mode === 'edit' ? 'Update Store' : 'Store Details'}
        </DialogTitle>
        <DialogContent dividers>
          {/* ROW 1: Store Name, Area, Monthly Target */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Store Name</Typography>
              <TextField
                fullWidth size="small"
                disabled={mode === 'view'}
                value={formData.store_name}
                onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
              />
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Area</Typography>
              <TextField
                fullWidth size="small"
                disabled={mode === 'view'}
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              />
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Monthly Target</Typography>
              <TextField
                fullWidth size="small" type="number"
                disabled={mode === 'view'}
                value={formData.targets}
                onChange={(e) => setFormData({ ...formData, targets: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
              />
            </Box>
          </Box>

          {/* ROW 2: City, Region, Beauty Advisor */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>City</Typography>
              <TextField
                select fullWidth size="small"
                disabled={mode === 'view'}
                value={formData.city_id}
                onChange={(e) => setFormData({ ...formData, city_id: e.target.value })}
              >
                {cities.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Region</Typography>
              <TextField
                select fullWidth size="small"
                disabled={mode === 'view'}
                value={formData.region_id}
                onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
              >
                {regions.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
              </TextField>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Beauty Advisor (BA)</Typography>
              <TextField
                select fullWidth size="small"
                disabled={mode === 'view'}
                value={formData.ba_user_id}
                onChange={(e) => setFormData({ ...formData, ba_user_id: e.target.value })}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {users.map(u => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
              </TextField>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpen(false)} variant="outlined" color="inherit">Cancel</Button>
          {mode !== 'view' && (
            <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#ab1d47', px: 4 }}>
              {mode === 'edit' ? 'Update Store' : 'Save Store'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Stores;