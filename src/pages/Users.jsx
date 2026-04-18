import React, { useEffect, useState, useCallback, useContext } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Pagination, IconButton, Button,
    CircularProgress, Stack, Dialog, DialogTitle, DialogContent,
    DialogActions, MenuItem, Grid, Tooltip, Divider
} from '@mui/material';
import { Edit, Delete, Add, Search, Visibility } from '@mui/icons-material';
import API from '../api/API';
import { AuthContext } from '../context/AuthContext';

const ROLES = [
    { value: 'admin', label: 'Admin' },
    { value: 'ccadmin', label: 'CC Admin' },
    { value: 'brandadmin', label: 'Brand Admin' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'user', label: 'User' }
];

const Users = () => {
    // Data States
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');


    const { user } = useContext(AuthContext);
    const userRole = user?.role;

    // Dropdown States
    const [cities, setCities] = useState([]);
    const [regions, setRegions] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [supervisors, setSupervisors] = useState([]);


    // active status handling states
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [pendingStatusUpdate, setPendingStatusUpdate] = useState(null);

    // Dialog Control
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState('add'); // 'add', 'edit', 'view'
    const [selectedId, setSelectedId] = useState(null);
    const [formData, setFormData] = useState({
        name: '', fullname: '', phone: '', password: '', cnic: '', address: '',
        city_id: '', region_id: '', designation_id: '', role: 'user', reportTo: ''
    });

    // 1. Fetch Users Data
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await API.get(`/users?page=${page}&limit=10&search=${search}`);
            setUsers(res.data.users);
            setTotalPages(res.data.totalPages);
            console.log("usersss ...", res.data.users)




        } catch (err) { console.error("Fetch Error:", err); }
        finally { setLoading(false); }
    }, [page, search]);

    // 2. Fetch Dropdowns (Once)
    useEffect(() => {
        const fetchDropdowns = async () => {
            try {
                const [c, r, d, u] = await Promise.all([
                    API.get('/cities'),
                    API.get('/regions'),
                    API.get('/designations'),
                    API.get('/users?limit=1000') // Saare users mangwaye
                ]);

                setCities(c.data);
                setRegions(r.data);
                setDesignations(d.data);

                // FIX: Pehle check karein ke data users array mein hai ya direct data hai
                const allUsersArray = u.data.users || u.data;

                const potentialManagers = allUsersArray.filter(user => {
                    // Designation check karein (Exactly 'Supervisor' jaisa console mein tha)
                    const designationName = user.designation?.name || '';

                    // Agar aap Admin ko bhi list mein chahte hain toh wo bhi add kar sakte hain
                    return designationName === 'Supervisor';
                });

                console.log("Filtered Supervisors:", potentialManagers); // Check karein console mein list aa rahi hai
                setSupervisors(potentialManagers);

            } catch (err) {
                console.error("Dropdown Error:", err);
            }
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
                fullname: user.fullname || '',
                phone: user.phone || '',
                password: '', // Edit/View mein password reset rakhein
                cnic: user.cnic || '',
                address: user.address || '',
                city_id: user.city_id || '',
                region_id: user.region_id || '',
                designation_id: user.designation_id || '',
                role: user.role || 'user',
                reportTo: user.reportTo || '',
                is_active: user.is_active
            });
        } else {
            setFormData({ name: '', fullname: '', phone: '', password: '', cnic: '', address: '', city_id: '', region_id: '', designation_id: '', role: 'user', reportTo: '' });
        }
        setOpen(true);
    };

    const handleSubmit = async () => {
        if (mode === 'view') { setOpen(false); return; }

        // --- FRONTEND VALIDATION LOGIC ---
        if (!formData.name || !formData.fullname || !formData.phone) {
            return alert("Error: User Name, Full Name, and Phone are mandatory!");
        }

        // Password Validation: 
        // ADD: Must exist and >= 6
        // EDIT: If provided, must be >= 6
        if (mode === 'add' && (!formData.password || formData.password.length < 6)) {
            return alert("Error: Password is required and must be at least 6 characters long.");
        }

        if (mode === 'edit' && formData.password && formData.password.length < 6) {
            return alert("Error: New password must be at least 6 characters long.");
        }

        // --- DATA CLEANING (Ensuring Sequelize Compatibility) ---
        const cleanedPayload = {
            ...formData,
            // Convert empty strings to NULL for IDs
            city_id: formData.city_id || null,
            region_id: formData.region_id || null,
            designation_id: formData.designation_id || null,
            reportTo: formData.reportTo || null,
            // Phone numbers hamesha string hone chahiye, handle leading zeros
            phone: formData.phone.toString().trim()
        };

        try {
            if (mode === 'edit') {
                await API.patch(`/users/${selectedId}`, cleanedPayload);
            } else {
                await API.post('/users/create-user', cleanedPayload);
            }
            setOpen(false);
            fetchUsers();
            alert("User Processed Successfully!");
        } catch (err) {
            // Detailed Error Feedback
            const errorMsg = err.response?.data?.message || "Operation failed!";
            const detailedError = err.response?.data?.error || "";

            console.error("User Submit Error:", err.response?.data);
            alert(`Error: ${errorMsg} ${detailedError}`);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("do you want to delete this user?")) {
            try {
                await API.delete(`/users/${id}`);
                fetchUsers();
            } catch (err) { alert("Delete fail!"); }
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
        // Agar ye console nahi aa raha, iska matlab hai onClick trigger hi nahi hua
        console.log("Function Triggered for ID:", id);

        try {
            const res = await API.patch('/status/toggle-status', {
                modelName: 'User',
                id: id
            });

            console.log("Backend Response:", res.data);

            if (res.data.success) {
                // Check karein backend 'is_active' bhej raha hai ya 'status'
                const newStatus = res.data.is_active;
                setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: newStatus } : u));
            }
        } catch (err) {
            console.error("API Error:", err);
            alert("Status update failed!");
        }
    };

    return (
        <Box>
            {/* Header Section */}
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#1b2142' }}>
                User Management
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
                <Table
                    size="small"
                    sx={{
                        tableLayout: 'fixed', // Uniformity ke liye zaroori hai
                        '& .MuiTableCell-root': {
                            fontSize: '0.75rem', // Default se chota (12px approx)
                            padding: '4px 8px',  // Vertical space kam karne ke liye
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }
                    }}
                >
                    {/* minWidth ensures it doesn't crush on mobile, tableLayout: fixed ensures uniformity */}
                    <TableHead sx={{ bgcolor: '#1b2142' }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 1.5 }}>User</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 1.5 }}>Full Name</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 1.5 }}>Phone</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 1.5 }}>CNIC</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 1.5 }}>Designation</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 1.5 }}>City</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 1.5 }}>Region</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 1.5 }}>ReportTo</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 1.5, textAlign: 'center' }}>Status</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center', py: 1.5 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center" sx={{ py: 3 }}><CircularProgress size={25} /></TableCell>
                            </TableRow>
                        ) : users.length > 0 ? (
                            users.map((u) => (
                                <TableRow key={u.id} hover sx={{ '& td': { py: 0.8, px: 1.5 } }}> {/* 👈 Padding mazeed kam ki */}
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{u.name}</TableCell>
                                    <TableCell sx={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{u.fullname || '-'}</TableCell>
                                    <TableCell sx={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{u.phone}</TableCell>
                                    <TableCell sx={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{u.cnic || '-'}</TableCell>
                                    <TableCell sx={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                        <Typography variant="caption" sx={{ bgcolor: '#f0f2f5', px: 1, py: 0.3, borderRadius: 1, fontWeight: 600 }}>
                                            {u.designation?.name || '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{u.city?.name || '-'}</TableCell>
                                    <TableCell sx={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{u.region?.name || '-'}</TableCell>
                                    <TableCell sx={{ fontSize: '0.85rem' }}>
                                        {u.manager ? (
                                            <Tooltip title={`Manager ID: ${u.reportTo}`}>
                                                <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#ab1d47', fontWeight: 500 }}>
                                                    {u.manager.name}
                                                </Typography>
                                            </Tooltip>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.85rem', textAlign: 'center' }}>
                                        <Tooltip title={u.is_active ? "Click to Deactivate" : "Click to Activate"}>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    confirmStatusToggle(u.id); // 👈 Ab ye direct call nahi karega, popup kholega
                                                }}
                                                sx={{
                                                    color: u.is_active ? '#28a745' : '#dc3545',
                                                    border: '1px solid',
                                                    borderColor: u.is_active ? '#28a745' : '#dc3545',
                                                    borderRadius: '4px',
                                                    width: '30px',
                                                    height: '30px',
                                                    '&:hover': { bgcolor: u.is_active ? '#e8f5e9' : '#ffebee' }
                                                }}
                                            >
                                                {u.is_active ? '✓' : '✗'}
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                                        <Stack direction="row" spacing={0.5} justifyContent="center">
                                            <IconButton onClick={() => handleOpen('view', u)} size="small" sx={{ color: '#17a2b8' }}>
                                                <Visibility sx={{ fontSize: 18 }} />
                                            </IconButton>
                                            <IconButton onClick={() => handleOpen('edit', u)} size="small" color="primary">
                                                <Edit sx={{ fontSize: 18 }} />
                                            </IconButton>
                                            {(userRole === 'admin') && (
                                                <IconButton onClick={() => handleDelete(u.id)} size="small" color="error">
                                                    <Delete sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            )}
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={9} align="center" sx={{ py: 3 }}>No users found.</TableCell>
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
                    {/* ROW 1: Full Name, Phone, CNIC */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Full Name</Typography>
                            <TextField
                                fullWidth size="small" placeholder="Enter full name"
                                disabled={mode === 'view'}
                                value={formData.fullname}
                                onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                            />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Phone Number</Typography>
                            <TextField
                                fullWidth size="small" placeholder="03001234567"
                                disabled={mode === 'view'}
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>CNIC Number</Typography>
                            <TextField
                                fullWidth size="small" placeholder="3310x-xxxxxxx-x"
                                disabled={mode === 'view'}
                                value={formData.cnic}
                                onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                            />
                        </Box>
                    </Box>

                    {/* ROW 2: Designation, City, Region */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Select Designation</Typography>
                            <TextField
                                select fullWidth size="small"
                                disabled={mode === 'view'}
                                value={formData.designation_id}
                                onChange={(e) => setFormData({ ...formData, designation_id: e.target.value })}
                            >
                                {designations.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                            </TextField>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Select City</Typography>
                            <TextField
                                select fullWidth size="small"
                                disabled={mode === 'view'}
                                value={formData.city_id}
                                onChange={(e) => setFormData({ ...formData, city_id: e.target.value })}
                            >
                                {cities.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                            </TextField>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Select Region</Typography>
                            <TextField
                                select fullWidth size="small"
                                disabled={mode === 'view'}
                                value={formData.region_id}
                                onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
                            >
                                {regions.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                            </TextField>
                        </Box>
                    </Box>

                    {/* ROW 3: Reporting To, User Name, Password */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Reporting To </Typography>
                            <TextField
                                select fullWidth size="small"
                                disabled={mode === 'view'}
                                value={formData.reportTo}
                                onChange={(e) => setFormData({ ...formData, reportTo: e.target.value })}
                            >
                                <MenuItem value=""><em>No Manager / Self</em></MenuItem>
                                {supervisors.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                            </TextField>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Role</Typography>
                            <TextField
                                select fullWidth size="small"
                                disabled={mode === 'view'}
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                {ROLES.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
                            </TextField>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>User Name</Typography>
                            <TextField
                                fullWidth size="small" placeholder="Enter username"
                                disabled={mode === 'view'}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </Box>
                        {/* Password Field: Visible in Add and Edit modes */}
                        {(mode === 'add' || mode === 'edit') && (
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    {mode === 'edit' ? 'Reset Password' : 'Account Password'}
                                </Typography>
                                <TextField
                                    fullWidth size="small"
                                    type="password"
                                    placeholder={mode === 'edit' ? "Leave blank to keep current" : "Set password"}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    // A11y Audit: Screen reader ko pata chalna chahiye ye kya hai
                                    inputProps={{ 'aria-label': 'password field' }}
                                />
                            </Box>
                        )}

                        {(mode === 'edit' || mode === 'view') && (
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Account Status</Typography>
                                <TextField
                                    select fullWidth size="small"
                                    value={formData.is_active}
                                    disabled={mode === 'view'}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                                >
                                    <MenuItem value={true}>🟢 Active</MenuItem>
                                    <MenuItem value={false}>🔴 Inactive</MenuItem>
                                </TextField>
                            </Box>
                        )}
                    </Box>


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
    );
};

export default Users;