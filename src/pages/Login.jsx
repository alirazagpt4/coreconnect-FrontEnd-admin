import React, { useState, useContext } from 'react';
import {
    Box, TextField, Button, Typography, Paper,
    Container, Alert, InputAdornment, IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, Lock, Person } from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../api/API';

const Login = () => {
    const [name, setName] = useState(''); // Username ke liye
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // API Call: /api/users/login
            const response = await API.post('/users/login', { name, password });

            // Response format check: { token: "...", user: {...} }
            if (response.data.token) {
                login(response.data.token, response.data.user);
                if (response.data.user.role === 'admin') {

                    navigate('/users'); // Login ke baad users list pe bhej do
                }
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Login fail hogaya! Username ya Password check karein.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            bgcolor: '#f0f2f5'
        }}>
            <Container maxWidth="xs">
                <Paper elevation={10} sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
                    {/* Logo ya Heading */}
                    <Typography variant="h4" sx={{ mb: 1, color: '#1b2142', fontWeight: 'bold' }}>
                        CORE CONNECT
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                        Login
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="User Name"
                            variant="outlined"
                            margin="normal"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Person sx={{ color: '#1b2142' }} />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            fullWidth
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            variant="outlined"
                            margin="normal"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Lock sx={{ color: '#1b2142' }} />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                            sx={{
                                mt: 3,
                                py: 1.5,
                                bgcolor: '#ab1d47',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                '&:hover': { bgcolor: '#8e183a' }
                            }}
                        >
                            {loading ? 'Logging in...' : 'Sign In'}
                        </Button>
                    </form>
                </Paper>
            </Container>
        </Box>
    );
};

export default Login;