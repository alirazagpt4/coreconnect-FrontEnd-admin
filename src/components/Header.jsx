import { AppBar, Toolbar, Typography, Button, Box, IconButton } from '@mui/material';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Menu from '@mui/icons-material/Menu'; // 'MenuIcon' ki jagah sirf 'Menu'

const Header = ({ toggleDrawer, open }) => {
  const { user, logout } = useContext(AuthContext);

  return (
    <AppBar position="fixed" sx={{
      zIndex: (theme) => theme.zIndex.drawer + 1,
      bgcolor: '#1b2142',
      boxShadow: 'none',
      borderBottom: '1px solid rgba(255,255,255,0.1)'
    }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="inherit"
            onClick={toggleDrawer}
            edge="start"
            sx={{ mr: 2 }}
          >
            <Menu />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 1 }}>
            CORE CONNECT
          </Typography>
        </Box>

        {/* Profile & Logout */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2">Hi, {user?.name}</Typography>
          <Button variant="contained" onClick={logout} sx={{ bgcolor: '#ab1d47' }}>Logout</Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;