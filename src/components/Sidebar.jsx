import React, { useState, useContext } from 'react';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Toolbar, Box, Collapse, Divider, Typography
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Store as StoreIcon,
  Inventory as InventoryIcon,
  Assessment as AssessmentIcon,
  ExpandLess, ExpandMore,
  BarChart as BarChartIcon
} from '@mui/icons-material';

import { AuthContext } from '../context/AuthContext';

const drawerWidth = 240;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // user object from context 
  const { user } = useContext(AuthContext);
  const userRole = user?.role;
  console.log("user role in side baar .. ", userRole);


  // Reports menu state
  const [openReports, setOpenReports] = useState(true); // Default open rakh raha hoon taake nazar aaye

  const handleReportsClick = () => {
    setOpenReports(!openReports);
  };

  // Helper function for active styles
  const isActive = (path) => location.pathname === path;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        [`& .MuiDrawer-paper`]: {
          flexShrink: 0,
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: '#f4f4f4',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden', // Drawer khud scroll nahi hoga
          borderRight: '1px solid #ddd'
        },
      }}
    >
      <Toolbar />

      {/* --- SECTION 1: SCROLLABLE MENU (80%) --- */}
      <Box sx={{
        flexGrow: 1,
        overflowY: 'auto',
        mt: 1,
        px: 1,
        '&::-webkit-scrollbar': { width: '4px' },
        '&::-webkit-scrollbar-thumb': { bgcolor: '#ccc', borderRadius: '10px' }
      }}>
        <List>
          {/* Dashboard */}
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => navigate('/dashboard')}
              selected={isActive('/dashboard')}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon sx={{ color: '#1b2142' }}><DashboardIcon /></ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItemButton>
          </ListItem>



          {/* Users */}
          {(userRole === 'admin' || userRole === 'ccadmin') && (
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate('/users')}
                selected={isActive('/users')}
                sx={{ borderRadius: 2 }}
              >
                <ListItemIcon sx={{ color: '#1b2142' }}><PeopleIcon /></ListItemIcon>
                <ListItemText primary="Users" />
              </ListItemButton>
            </ListItem>
          )}



          {/* Stores */}
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => navigate('/stores')}
              selected={isActive('/stores')}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon sx={{ color: '#1b2142' }}><StoreIcon /></ListItemIcon>
              <ListItemText primary="Stores" />
            </ListItemButton>
          </ListItem>

          {/* Items */}
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => navigate('/items')}
              selected={isActive('/items')}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon sx={{ color: '#1b2142' }}><InventoryIcon /></ListItemIcon>
              <ListItemText primary="Items" />
            </ListItemButton>
          </ListItem>

          {/* --- NESTED REPORTS MENU --- */}
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton onClick={handleReportsClick} sx={{ borderRadius: 2 }}>
              <ListItemIcon sx={{ color: '#1b2142' }}>
                <BarChartIcon />
              </ListItemIcon>
              <ListItemText primary="Reports" sx={{ fontWeight: 'bold' }} />
              {openReports ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>

          <Collapse in={openReports} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>

              {[
                { name: 'Attendance Report', path: '/attendance-report' },
                { name: 'Daily Sales Report', path: '/sales-report' },
                { name: 'Summary Sales Report', path: '/summary-report' },
                { name: 'Short Items Report', path: '/short-items-report' },
                { name: 'Interception Reports', path: '/interception-report' }
              ].map((report) => (
                <ListItemButton
                  key={report.path}
                  onClick={() => navigate(report.path)}
                  selected={isActive(report.path)}
                  sx={{
                    pl: 4,
                    my: 0.2,
                    mx: 1,
                    borderRadius: '8px',
                    '&.Mui-selected': {
                      borderRight: '4px solid #ab1d47',
                      bgcolor: '#e8eaf6'
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 35 }}>
                    <AssessmentIcon fontSize="small" sx={{ color: isActive(report.path) ? '#ab1d47' : '#555' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={report.name}
                    primaryTypographyProps={{
                      fontSize: '0.85rem',
                      fontWeight: isActive(report.path) ? 'bold' : 'normal',
                      color: isActive(report.path) ? '#ab1d47' : '#333'
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Collapse>
        </List>
      </Box>

      {/* --- SECTION 2: FIXED FOOTER (FULL WIDTH) --- */}
      <Box sx={{
        textAlign: 'center',
        bgcolor: '#ffffff', // Background pure white kar diya
        borderTop: '1px solid #ddd',
        mt: 'auto', // Pushes to the very bottom
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        py: 1.5, // Upar niche halki space (Height kam karne ke liye)
        // p: 2 ko hata diya taake side par space na bache
      }}>
        <img
          src="/rivaj-logo.jpeg"
          alt="Ravaj Logo"
          style={{
            width: 'auto',       // Width auto taake original ratio barqarar rahe
            height: '32px',      // Height control kar li taake zyada jagah na ghere
            maxWidth: '180px',   // Max width thori barha di taake logo saaf dikhe
            objectFit: 'contain',
            display: 'block'
          }}
        />
      </Box>
    </Drawer>
  );
};

export default Sidebar;