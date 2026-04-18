import React, { useState, useContext } from 'react';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Toolbar, Box, Collapse, Divider, Tooltip
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

const Sidebar = ({ open, toggleDrawer }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const userRole = user?.role;

  const [openReports, setOpenReports] = useState(false);

  const isActive = (path) => location.pathname === path;

  // Reusable Nav Item Component taake code saaf rahay
  const NavItem = ({ icon, label, path, onClick }) => (
    <Tooltip title={!open ? label : ""} placement="right">
      <ListItem disablePadding sx={{ display: 'block', mb: 0.5 }}>
        <ListItemButton
          onClick={onClick || (() => navigate(path))}
          selected={isActive(path)}
          sx={{
            minHeight: 48,
            justifyContent: open ? 'initial' : 'center',
            px: 2.5,
            borderRadius: open ? 2 : 0,
            mx: open ? 1 : 0,
            '&.Mui-selected': {
              bgcolor: '#e8eaf6',
              borderRight: open ? 'none' : '4px solid #ab1d47',
              '& .MuiListItemIcon-root': { color: '#ab1d47' }
            },
          }}
        >
          <ListItemIcon sx={{
            minWidth: 0,
            mr: open ? 2 : 'auto',
            justifyContent: 'center',
            color: isActive(path) ? '#ab1d47' : '#1b2142'
          }}>
            {icon}
          </ListItemIcon>
          {open && <ListItemText primary={label} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: isActive(path) ? 600 : 400 }} />}
        </ListItemButton>
      </ListItem>
    </Tooltip>
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? 240 : 70,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        [`& .MuiDrawer-paper`]: {
          width: open ? 240 : 70,
          transition: (theme) => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
          bgcolor: '#f4f4f4',
          borderRight: '1px solid #ddd',
          display: 'flex',
          flexDirection: 'column'
        },
      }}
    >
      <Toolbar />

      <Box sx={{ flexGrow: 1, overflowY: 'auto', mt: 2 }}>
        <List>
          {/* 1. Dashboard */}
          <NavItem icon={<DashboardIcon />} label="Dashboard" path="/dashboard" />

          {/* 2. Users (Role Protected) */}
          {(userRole === 'admin' || userRole === 'ccadmin') && (
            <NavItem icon={<PeopleIcon />} label="Users" path="/users" />
          )}

          {/* 3. Stores */}
          <NavItem icon={<StoreIcon />} label="Stores" path="/stores" />

          {/* 4. Items */}
          <NavItem icon={<InventoryIcon />} label="Items" path="/items" />

          {/* 5. Reports (Nested) */}
          <ListItem disablePadding sx={{ display: 'block', mb: 0.5 }}>
            <ListItemButton
              onClick={() => {
                if (!open) { toggleDrawer(); setOpenReports(true); }
                else { setOpenReports(!openReports); }
              }}
              sx={{ minHeight: 48, justifyContent: open ? 'initial' : 'center', px: 2.5, mx: open ? 1 : 0 }}
            >
              <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center', color: '#1b2142' }}>
                <BarChartIcon />
              </ListItemIcon>
              {open && <ListItemText primary="Reports" sx={{ fontWeight: 'bold' }} />}
              {open && (openReports ? <ExpandLess /> : <ExpandMore />)}
            </ListItemButton>
          </ListItem>

          <Collapse in={openReports && open} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {[
                { name: 'Attendance Report', path: '/attendance-report' },
                { name: 'Daily Sales Report', path: '/sales-report' },
                { name: 'Channel Sales Report', path: '/channelwisesummary-report' },
                // { name: 'Sale Summary Report', path: '/summary-report' },
                { name: 'Short Items Report', path: '/short-items-report' },
                { name: 'Interception Report', path: '/interception-report' },
                { name: 'Short Tester Report', path: '/shorttester-report' },
                { name: 'Expiry Stock Report', path: '/expirystock-report' },


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
                    '&.Mui-selected': { borderRight: '4px solid #ab1d47', bgcolor: '#e8eaf6' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 35 }}>
                    <AssessmentIcon fontSize="small" sx={{ color: isActive(report.path) ? '#ab1d47' : '#555' }} />
                  </ListItemIcon>
                  {open && <ListItemText primary={report.name} primaryTypographyProps={{ fontSize: '0.8rem' }} />}
                </ListItemButton>
              ))}
            </List>
          </Collapse>
        </List>
      </Box>

      {/* Logo Section - Bottom */}
      <Box sx={{ p: 2, mt: 'auto', textAlign: 'left' }}>
        <img
          src="/rivaj.png"
          alt="Logo"
          style={{
            width: open ? '60%' : '50px',
            transition: '0.3s',
            filter: 'contrast(1.1)'
          }}
        />
      </Box>
    </Drawer>
  );
};

export default Sidebar;