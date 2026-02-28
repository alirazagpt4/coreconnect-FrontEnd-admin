import { Box, CssBaseline } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

const Layout = () => {
  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <CssBaseline />
      
      {/* 1. Sidebar: Full Height Pillar */}
      <Sidebar />

      {/* 2. Content Wrapper: Is mein Header aur Scrollable Body hogi */}
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column',
        height: '100vh',
        width: `calc(100% - 220px)` 
      }}>
        
        <Header />

        {/* 3. Scrollable Container: Is mein Content + Footer dono honge */}
        <Box sx={{ 
          flexGrow: 1, 
          overflowY: 'auto', // Sirf ye area scroll hoga
          bgcolor: '#f8f9fa',
          mt: '54px', // Header ki height
          display: 'flex',
          flexDirection: 'column'
        }}>
          
          {/* Main Page Content (Users, Stores, etc.) */}
          <Box sx={{ p: 3, flexGrow: 1 }}>
            <Outlet />
          </Box>

          {/* Footer: Ab ye Outlet ke nichay ayega aur scroll bhi saath hoga */}
          <Footer />
          
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;