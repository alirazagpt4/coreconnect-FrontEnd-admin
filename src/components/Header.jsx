import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import LogoutIcon from '@mui/icons-material/Logout';

const Header = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: '#1b2142' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
          CORE CONNECT
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body1">
            Hi, {user?.name || 'Admin'}
          </Typography>
          <Button 
            onClick={logout} 
            variant="outlined" 
            startIcon={<LogoutIcon />}
            sx={{ color: '#fff', borderColor: '#ab1d47', '&:hover': { bgcolor: '#ab1d47', borderColor: '#fff' } }}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;