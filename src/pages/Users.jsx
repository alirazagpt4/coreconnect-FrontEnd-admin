import React, { useEffect, useState, useCallback } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Pagination, IconButton, Button,
    CircularProgress, Stack, Dialog, DialogTitle, DialogContent,
    DialogActions, MenuItem, Grid, Tooltip, Divider
} from '@mui/material';
import { Edit, Delete, Add, Search, Visibility } from '@mui/icons-material';
import API from '../api/API';

const Users = () => {
    // Data States
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');

    // Dropdown States
    const [cities, setCities] = useState([]);
    const [regions, setRegions] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [supervisors, setSupervisors] = useState([]);

    // Dialog Control
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState('add'); // 'add', 'edit', 'view'
    const [selectedId, setSelectedId] = useState(null);
    const [formData, setFormData] = useState({
        name: '', phone: '', password: '', cnic: '', address: '',
        city_id: '', region_id: '', designation_id: '', role: 'user', reportTo: ''
    });

    // 1. Fetch Users Data
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await API.get(`/users?page=${page}&limit=10&search=${search}`);
            setUsers(res.data.users);
            setTotalPages(res.data.totalPages);
            // ReportTo ke liye hum users ki list hi use kar lete hain (Jo supervisor hon)
            setSupervisors(res.data.users.filter(u => u.role === 'supervisor' || u.role === 'admin'));
        } catch (err) { console.error("Fetch Error:", err); }
        finally { setLoading(false); }
    }, [page, search]);

    // 2. Fetch Dropdowns (Once)
    useEffect(() => {
        const fetchDropdowns = async () => {
            try {
                const [c, r, d] = await Promise.all([
                    API.get('/cities'),
                    API.get('/regions'),
                    API.get('/designations')
                ]);
                setCities(c.data); setRegions(r.data); setDesignations(d.data);
            } catch (err) { console.error("Dropdown Error:", err); }
        };
        fetchDropdowns();
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // 3. Action Handlers
    const handleOpen = (type, user = null) => {
        setMode(type);
        if (user) {
            setSelectedId(user.id);
            setFormData({
                name: user.name || '',
                phone: user.phone || '',
                password: '', // Edit/View mein password reset rakhein
                cnic: user.cnic || '',
                address: user.address || '',
                city_id: user.city_id || '',
                region_id: user.region_id || '',
                designation_id: user.designation_id || '',
                role: user.role || 'user',
                reportTo: user.reportTo || ''
            });
        } else {
            setFormData({ name: '', phone: '', password: '', cnic: '', address: '', city_id: '', region_id: '', designation_id: '', role: 'user', reportTo: '' });
        }
        setOpen(true);
    };

    const handleSubmit = async () => {
        if (mode === 'view') { setOpen(false); return; }
        try {
            if (mode === 'edit') {
                await API.patch(`/users/${selectedId}`, formData);
            } else {
                await API.post('/users/create-user', formData);
            }
            setOpen(false);
            fetchUsers();
        } catch (err) { alert("Operation failed! Check console."); }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bawa ji, kya aap waqai is user ko delete karna chahte hain?")) {
            try {
                await API.delete(`/users/${id}`);
                fetchUsers();
            } catch (err) { alert("Delete fail!"); }
        }
    };

    return (
        <Box>
            {/* Header Section */}
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#1b2142' }}>
                Users Management
            </Typography>

            {/* Search and Add Bar */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Paper sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 400, boxShadow: 1 }}>
                    <Search sx={{ p: 1, color: 'gray' }} />
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search by name or phone..."
                        variant="standard"
                        InputProps={{ disableUnderline: true }}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </Paper>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpen('add')}
                    sx={{ bgcolor: '#ab1d47', '&:hover': { bgcolor: '#8e183a' }, textTransform: 'none', fontWeight: 'bold' }}
                >
                    Add New User
                </Button>
            </Stack>

            {/* Users Table */}
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3, overflowX: 'auto' }}>
                <Table sx={{ minWidth: 1100 }}> {/* Minimum width taake columns cramp na hon */}
                    <TableHead sx={{ bgcolor: '#1b2142' }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Phone</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>CNIC</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Designation</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>City</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Region</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Reports To</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center"><CircularProgress size={30} /></TableCell>
                            </TableRow>
                        ) : users.length > 0 ? (
                            users.map((u) => (
                                <TableRow key={u.id} hover>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#ab1d47' }}>#{u.id}</TableCell>
                                    <TableCell sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{u.name}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{u.phone}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{u.cnic || '-'}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{u.designation?.name || '-'}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{u.city?.name || '-'}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{u.region?.name || '-'}</TableCell>
                                    <TableCell>
                                        {/* Agar reportTo ki ID hai toh dikhao, warna '-' */}
                                        {u.reportTo ? ` ${u.manager.name}` : 'None'}
                                    </TableCell>
                                    <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                                        <Stack direction="row" spacing={1} justifyContent="center">
                                            <Tooltip title="View">
                                                <IconButton onClick={() => handleOpen('view', u)} size="small" sx={{ color: '#17a2b8' }}>
                                                    <Visibility fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit">
                                                <IconButton onClick={() => handleOpen('edit', u)} size="small" color="primary">
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton onClick={() => handleDelete(u.id)} size="small" color="error">
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={9} align="center">No users found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination */}
            <Stack alignItems="center" sx={{ mt: 3 }}>
                <Pagination count={totalPages} page={page} onChange={(e, v) => setPage(v)} color="primary" />
            </Stack>

            {/* MASTER DIALOG (Add / Edit / View) */}
            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                maxWidth="md"
                fullWidth
                scroll="paper"
            >
                <DialogTitle sx={{ bgcolor: '#1b2142', color: 'white', py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {mode === 'add' ? 'Create New User' : mode === 'edit' ? 'Update User Information' : 'User Detailed Profile'}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>CoreConnect ERP</Typography>
                </DialogTitle>

                <DialogContent dividers>
                    <Grid container spacing={3} sx={{ mt: 0.1 }}>

                        {/* Row 1 */}
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', color: '#333' }}>Full Name</Typography>
                            <TextField fullWidth placeholder="Enter full name" disabled={mode === 'view'} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', color: '#333' }}>Phone Number</Typography>
                            <TextField fullWidth placeholder="e.g. 03001234567" disabled={mode === 'view'} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                        </Grid>

                        {/* Row 2 */}
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', color: '#333' }}>CNIC Number</Typography>
                            <TextField fullWidth placeholder="3310x-xxxxxxx-x" disabled={mode === 'view'} value={formData.cnic} onChange={(e) => setFormData({ ...formData, cnic: e.target.value })} />
                        </Grid>
                        {mode === 'add' && (
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', color: '#333' }}>Account Password</Typography>
                                <TextField fullWidth type="password" placeholder="Set password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                            </Grid>
                        )}

                        <Grid item xs={12}><Divider /></Grid>

                        {/* Row 3 - Selects (Ab labels kabhi nahi chupenge) */}
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', color: '#333' }}>Select City</Typography>
                            <TextField select fullWidth disabled={mode === 'view'} value={formData.city_id} onChange={(e) => setFormData({ ...formData, city_id: e.target.value })}>
                                {cities.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', color: '#333' }}>Select Region</Typography>
                            <TextField select fullWidth disabled={mode === 'view'} value={formData.region_id} onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}>
                                {regions.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                            </TextField>
                        </Grid>

                        {/* Row 4 */}
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', color: '#333' }}>Select Designation</Typography>
                            <TextField select fullWidth disabled={mode === 'view'} value={formData.designation_id} onChange={(e) => setFormData({ ...formData, designation_id: e.target.value })}>
                                {designations.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', color: '#333' }}>Assign System Role</Typography>
                            <TextField select fullWidth disabled={mode === 'view'} value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                                <MenuItem value="user">Standard User</MenuItem>
                                <MenuItem value="supervisor">Supervisor</MenuItem>
                                <MenuItem value="admin">Administrator</MenuItem>
                            </TextField>
                        </Grid>

                        <Grid item xs={12}><Divider /></Grid>

                        {/* Row 5 */}
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', color: '#333' }}>Reporting To (Manager)</Typography>
                            <TextField select fullWidth disabled={mode === 'view'} value={formData.reportTo} onChange={(e) => setFormData({ ...formData, reportTo: e.target.value })}>
                                <MenuItem value=""><em>No Manager / Self</em></MenuItem>
                                {supervisors.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', color: '#333' }}>Complete Residential Address</Typography>
                            <TextField fullWidth multiline rows={2} disabled={mode === 'view'} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ p: 3, bgcolor: '#f8f9fa' }}>
                    <Button onClick={() => setOpen(false)} variant="outlined" color="inherit" sx={{ px: 4 }}>CLOSE</Button>
                    {mode !== 'view' && (
                        <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#ab1d47', px: 4, '&:hover': { bgcolor: '#8e183a' } }}>
                            {mode === 'edit' ? 'CONFIRM & UPDATE' : 'CONFIRM & SAVE'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Users;