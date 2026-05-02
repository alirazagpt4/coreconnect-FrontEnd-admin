import React, { useEffect, useState, useCallback, useContext } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Pagination, IconButton, Button,
  CircularProgress, Stack, Dialog, DialogTitle, DialogContent,
  DialogActions, MenuItem, Grid, Tooltip, Divider, InputAdornment
} from '@mui/material';
import { Edit, Delete, Add, Search, Visibility, Store as StoreIcon, Person, Phone, LocationCity } from '@mui/icons-material';
import API from '../api/API'; // Yeh baseURL/api tak set hai
import { AuthContext } from '../context/AuthContext';

const Stores = () => {
  const [stores, setStores] = useState([]);
  const [channels, setChannels] = useState([]); //
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const { user } = useContext(AuthContext);
  const userRole = user?.role;


  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState(null); // ID store karne ke liye




  // Dropdown States
  const [cities, setCities] = useState([]);
  const [regions, setRegions] = useState([]);
  const [users, setUsers] = useState([]); // For Beauty Advisors
  const [supervisors, setSupervisors] = useState([]);

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
    ba_user_id_2: '',
    ba_user_id_3: '',
    supervisor_id: '',
    channel_id: '',
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
    let isMounted = true;

    const fetchDropdowns = async () => {
      try {
        const [c, r, u, ch, sup] = await Promise.all([
          API.get('/cities'),
          API.get('/regions'),
          API.get('/users?limit=1000'),
          API.get('/channels/getchannels'),
          API.get('/users/supervisors')
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
        setChannels(ch.data || []);


        // 1. Filter Supervisors: In IDs (5, 21, 22) ko nikal do
        const excludedIds = [5, 21, 22];
        const filteredSupervisors = (sup.data.data || []).filter(
          s => !excludedIds.includes(s.id)
        );
        setSupervisors(filteredSupervisors);

        // Yahan filter update karein: role 'user' ho AUR active ho
        const activeBAs = u.data.users ? u.data.users.filter(user =>
          user.role === 'user' && user.is_active === true
        ) : [];

        console.log("active bas", activeBAs);

        setUsers(activeBAs);



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
        ba_user_id_2: store.ba_user_id_2 || '',
        ba_user_id_3: store.ba_user_id_3 || '',
        supervisor_id: store.supervisor_id || '',
        targets: store.targets || '',
        channel_id: store.channel_id || '',
        is_active: store.is_active


      });
    } else {
      setFormData({ store_name: '', area: '', city_id: '', region_id: '', ba_user_id: '', ba_user_id_2: '', ba_user_id_3: '', supervisor_id: '', targets: '' });
    }
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (mode === 'view') { setOpen(false); return; }

    // 🔥 CORE FIX: Data Transformation
    const payload = {
      ...formData,
      // Agar supervisor_id empty string hai toh usay null kar do
      supervisor_id: formData.supervisor_id || null,

      // Target ko string se number mein convert karo
      targets: formData.targets ? parseFloat(formData.targets) : 0,

      // Baki IDs ke liye bhi safety check
      ba_user_id: formData.ba_user_id || null,
      ba_user_id_2: formData.ba_user_id_2 || null,
      ba_user_id_3: formData.ba_user_id_3 || null,
      channel_id: formData.channel_id || null
    };

    console.log("Final Payload being sent:", payload);

    try {
      if (mode === 'edit') {
        await API.patch(`/store/${selectedId}`, payload);
      } else {
        await API.post('/store/create-store', payload);
      }
      setOpen(false);
      fetchStores();
      // alert("Store successfully created/updated!");
    } catch (err) {
      // Backend se aane wala exact error message
      const msg = err.response?.data?.message || "Action Failed!";
      const dbError = err.response?.data?.error || ""; // Sequelize error details

      console.error("Submission Error:", err.response?.data);
      alert(`Error: ${msg} ${dbError}`);
    }
  };


  // Jab user tick/cross par click kare
  const confirmStatusToggle = (id) => {
    setPendingStatusUpdate(id);
    setStatusDialogOpen(true);
  };

  // Jab user popup mein 'YES' click kare
  const processStatusToggle = async () => {
    if (pendingStatusUpdate) {
      await handleToggleActive(pendingStatusUpdate);
      setStatusDialogOpen(false);
      setPendingStatusUpdate(null);
    }
  };

  const handleToggleActive = async (id) => {
    try {
      const res = await API.patch('/status/toggle-status', {
        modelName: 'Store', // Backend model ka naam yahan 'Store' hoga
        id: id
      });

      if (res.data.success) {
        const newStatus = res.data.is_active;
        setStores(prev => prev.map(s => s.id === id ? { ...s, is_active: newStatus } : s));
      }
    } catch (err) {
      console.error("Status update error:", err);
      alert("Status update failed!");
    }
  };

  return (
    <>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#1b2142' }}>
          Store Management
        </Typography>

        <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}>
          <Paper sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 510 }}>
            <Search sx={{ p: 1, color: 'gray' }} />
            <TextField
              fullWidth
              size="small"
              variant="standard"

              placeholder="Search by Store Name, Area, City, BA , Supervisor and Channel..."
              InputProps={{
                disableUnderline: true,
                // Screen reader ke liye label lazmi hai
                inputProps: { 'aria-label': 'Search stores by name, area, city, supervisor , ba , channel ' }
              }}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1); // Ye bohot zaroori hai, taake results page 1 se shuru hon
              }}
            />
          </Paper>
          {(userRole === 'admin' || userRole === 'ccadmin') && (
            <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen('add')} sx={{ bgcolor: '#ab1d47', '&:hover': { bgcolor: '#8e183a' } }}>
              Add New Store
            </Button>
          )}

        </Stack>

        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3, overflowX: 'auto' }}>
          <Table
            size="small"
            sx={{
              tableLayout: 'fixed', // Uniformity ke liye zaroori hai
              '& .MuiTableCell-root': {
                fontSize: '0.75rem', // Default se chota (12px approx)
                padding: '4px 8px',  // Vertical space kam karne ke liye
                whiteSpace: 'wrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }
            }}
          >
            {/* minWidth ensures it doesn't crush on mobile, tableLayout: fixed ensures uniformity */}
            <TableHead sx={{ bgcolor: '#1b2142' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 1 }}>Store Name</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 1 }}>City</TableCell> {/* City bhi add kar di */}
                <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 1 }}>Area</TableCell> {/* 👈 Area Field Added */}
                {/* <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 1 }}>Manager</TableCell> */}
                <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 1 }}>Target</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Supervisor</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 1 }}>BA Assigned</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 1 }}>Channel</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 1 }}>Status</TableCell>
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
                  <TableCell>
                    <Typography variant="caption" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', px: 1, borderRadius: 1, fontWeight: 'bold' }}>
                      {s.supervisor?.fullname || s.supervisor?.name || 'Unassigned'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      {s.beauty_advisor && (
                        <Typography variant="caption" sx={{ bgcolor: '#e3f2fd', color: '#1976d2', px: 1, borderRadius: 1, fontWeight: 'bold', width: 'fit-content' }}>
                          BA 1: {s.beauty_advisor.fullname}
                        </Typography>
                      )}
                      {s.beauty_advisor_2 && (
                        <Typography variant="caption" sx={{ bgcolor: '#fff3e0', color: '#e65100', px: 1, borderRadius: 1, fontWeight: 'bold', width: 'fit-content' }}>
                          BA 2: {s.beauty_advisor_2.fullname}
                        </Typography>
                      )}
                      {/* Added BA 3 Badge */}
                      {s.beauty_advisor_3 && (
                        <Typography variant="caption" sx={{ bgcolor: '#f1f8e9', color: '#33691e', px: 1, borderRadius: 1, fontWeight: 'bold', width: 'fit-content' }}>
                          BA 3: {s.beauty_advisor_3.fullname}
                        </Typography>
                      )}
                      {!s.beauty_advisor && !s.beauty_advisor_2 && !s.beauty_advisor_3 && (
                        <Typography variant="caption" sx={{ color: '#757575', fontStyle: 'italic' }}>Unassigned</Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>
                    <Typography variant="caption" sx={{ bgcolor: '#f3e5f5', color: '#7b1fa2', px: 1, borderRadius: 1, fontWeight: 'bold' }}>
                      {s.channel?.name || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>
                    <Tooltip title={s.is_active ? "Deactivate Store" : "Activate Store"}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmStatusToggle(s.id); // 👈 Ab ye direct call nahi karega, popup kholega
                        }}
                        sx={{
                          color: s.is_active ? '#28a745' : '#dc3545',
                          border: '1px solid',
                          borderColor: s.is_active ? '#28a745' : '#dc3545',
                          borderRadius: '4px',
                          width: '30px',
                          height: '30px',
                          '&:hover': { bgcolor: s.is_active ? '#e8f5e9' : '#ffebee' }
                        }}
                      >
                        {s.is_active ? '✓' : '✗'}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Tooltip title="View"><IconButton size="small" color="info" onClick={() => handleOpen('view', s)}><Visibility sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                      {(userRole === 'admin' || userRole === 'ccadmin') && (
                        <>
                          <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => handleOpen('edit', s)}><Edit sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                          {(userRole === 'admin') && (
                            <Tooltip title="Delete"><IconButton size="small" color="error"><Delete sx={{ fontSize: 18 }} /></IconButton></Tooltip>
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
            </Box>

            {/* ROW 2: City, Region, Beauty Advisor */}
            <Box sx={{ display: 'flex', gap: 2 }}>


              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Channel</Typography>
                <TextField
                  select fullWidth size="small"
                  disabled={mode === 'view'}
                  value={formData.channel_id}
                  onChange={(e) => setFormData({ ...formData, channel_id: e.target.value })}
                >
                  <MenuItem value=""><em>Select Channel</em></MenuItem>
                  {channels.map((ch) => (
                    <MenuItem key={ch.id} value={ch.id}>{ch.name}</MenuItem>
                  ))}
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
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Supervisor</Typography>
                <TextField
                  select fullWidth size="small"
                  disabled={mode === 'view'}
                  value={formData.supervisor_id}
                  onChange={(e) => setFormData({ ...formData, supervisor_id: e.target.value })}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {supervisors.map(sup => (
                    <MenuItem key={sup.id} value={sup.id}>{sup.fullname || sup.name}</MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>BA 1</Typography>
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

              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>BA 2</Typography>
                <TextField
                  select fullWidth size="small"
                  disabled={mode === 'view'}
                  value={formData.ba_user_id_2}
                  onChange={(e) => setFormData({ ...formData, ba_user_id_2: e.target.value })}
                  InputProps={{ inputProps: { 'aria-label': 'Select BA 2' } }}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {users.map(u => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
                </TextField>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>BA 3</Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  disabled={mode === 'view'}
                  value={formData.ba_user_id_3}
                  onChange={(e) => setFormData({ ...formData, ba_user_id_3: e.target.value })}
                  InputProps={{ inputProps: { 'aria-label': 'Select BA 3' } }}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {users.map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>


              {/* ROW 3: Account Status for Edit/View */}
              {(mode === 'edit' || mode === 'view') && (
                <Box sx={{ flex: 1 }}> {/* Alignment matching other rows */}
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Store Status</Typography>
                  <TextField
                    select fullWidth size="small"
                    disabled={mode === 'view'}
                    value={formData.is_active || false}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                  >
                    <MenuItem value={true}>🟢 Active</MenuItem>
                    <MenuItem value={false}>🔴 Inactive</MenuItem>
                  </TextField>
                </Box>
              )}
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
        {/* STATUS CONFIRMATION DIALOG */}
        <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>Confirm Action</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to change this user's account status?</Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setStatusDialogOpen(false)} variant="outlined" color="inherit">
              No, Cancel
            </Button>
            <Button onClick={processStatusToggle} variant="contained" sx={{ bgcolor: '#ab1d47', '&:hover': { bgcolor: '#8e183a' } }}>
              Yes, Proceed
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};

export default Stores;