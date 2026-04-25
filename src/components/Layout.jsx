import React from 'react'
import { Box, CssBaseline } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useSidebar } from '../context/SideBarContext.jsx';
const Layout = () => {
  // const [open, setOpen] = React.useState(true); // Sidebar state

  // const toggleDrawer = () => setOpen(!open);
  const { open, toggleDrawer } = useSidebar();
  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#f8f9fa' }}>
      <CssBaseline />

      {/* Sidebar ko open state pass karein */}
      <Sidebar open={open} toggleDrawer={toggleDrawer} />

      <Box sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        transition: 'margin 0.3s ease', // Smooth transition
      }}>
        {/* Header mein toggle function pass karein */}
        <Header toggleDrawer={toggleDrawer} open={open} />

        <Box component="main" sx={{
          flexGrow: 1,
          overflowY: 'auto',
          mt: '64px', // Standard Header height
          p: 3
        }}>
          <Outlet />
          <Footer />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;