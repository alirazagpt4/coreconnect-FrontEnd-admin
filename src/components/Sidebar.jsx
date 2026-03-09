import React, { useState } from 'react';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Toolbar, Box, Collapse
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  People as PeopleIcon,
  Store as StoreIcon,
  Inventory as InventoryIcon,
  Assessment as AssessmentIcon,
  ExpandLess, ExpandMore,
  BarChart as BarChartIcon
} from '@mui/icons-material';

const drawerWidth = 240;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Reports menu ko open/close karne ki state
  const [openReports, setOpenReports] = useState(false);

  const handleReportsClick = () => {
    setOpenReports(!openReports);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', bgcolor: '#f4f4f4' },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto', mt: 2 }}>
        <List>
          {/* --- Regular Menus --- */}
          <ListItem disablePadding>
            <ListItemButton onClick={() => navigate('/users')} selected={location.pathname === '/users'}>
              <ListItemIcon sx={{ color: '#1b2142' }}><PeopleIcon /></ListItemIcon>
              <ListItemText primary="Users" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton onClick={() => navigate('/stores')} selected={location.pathname === '/stores'}>
              <ListItemIcon sx={{ color: '#1b2142' }}><StoreIcon /></ListItemIcon>
              <ListItemText primary="Stores" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton onClick={() => navigate('/items')} selected={location.pathname === '/items'}>
              <ListItemIcon sx={{ color: '#1b2142' }}><InventoryIcon /></ListItemIcon>
              <ListItemText primary="Items" />
            </ListItemButton>
          </ListItem>

          {/* --- NESTED REPORTS MENU --- */}
          {/* --- NESTED REPORTS MENU --- */}
          <ListItem disablePadding>
            <ListItemButton onClick={handleReportsClick}>
              <ListItemIcon sx={{ color: '#1b2142' }}>
                <BarChartIcon />
              </ListItemIcon>
              <ListItemText primary="Reports" />
              {openReports ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>

          <Collapse in={openReports} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>

              {/* 1. Attendance Report */}
              <ListItemButton
                sx={{
                  pl: 4,
                  '&.Mui-selected': { borderRight: '4px solid #ab1d47', bgcolor: '#f0f0f0' },
                  '&.Mui-selected:hover': { bgcolor: '#e0e0e0' }
                }}
                onClick={() => navigate('/attendance-report')}
                selected={location.pathname === '/attendance-report'}
              >
                <ListItemIcon sx={{ color: location.pathname === '/attendance-report' ? '#ab1d47' : '#1b2142' }}>
                  <AssessmentIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Attendance Report"
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: location.pathname === '/attendance-report' ? 'bold' : 'normal',
                    color: location.pathname === '/attendance-report' ? '#ab1d47' : 'inherit'
                  }}
                />
              </ListItemButton>

              {/* 2. Sales Report */}
              <ListItemButton
                sx={{
                  pl: 4,
                  '&.Mui-selected': { borderRight: '4px solid #ab1d47', bgcolor: '#f0f0f0' },
                  '&.Mui-selected:hover': { bgcolor: '#e0e0e0' }
                }}
                onClick={() => navigate('/sales-report')}
                selected={location.pathname === '/sales-report'} // 👈 Corrected
              >
                <ListItemIcon sx={{ color: location.pathname === '/sales-report' ? '#ab1d47' : '#1b2142' }}> {/* 👈 Fixed logic here */}
                  <AssessmentIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Daily Sales Report"
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: location.pathname === '/sales-report' ? 'bold' : 'normal',
                    color: location.pathname === '/sales-report' ? '#ab1d47' : 'inherit'
                  }}
                />
              </ListItemButton>



              {/* 2. Sales Report */}
              <ListItemButton
                sx={{
                  pl: 4,
                  '&.Mui-selected': { borderRight: '4px solid #ab1d47', bgcolor: '#f0f0f0' },
                  '&.Mui-selected:hover': { bgcolor: '#e0e0e0' }
                }}
                onClick={() => navigate('/summary-report')}
                selected={location.pathname === '/summary-report'} // 👈 Corrected
              >
                <ListItemIcon sx={{ color: location.pathname === '/summary-report' ? '#ab1d47' : '#1b2142' }}> {/* 👈 Fixed logic here */}
                  <AssessmentIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Summary Sales Report"
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: location.pathname === '/summary-report' ? 'bold' : 'normal',
                    color: location.pathname === '/summary-report' ? '#ab1d47' : 'inherit'
                  }}
                />
              </ListItemButton>


            </List>
          </Collapse>
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;