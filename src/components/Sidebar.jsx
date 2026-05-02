import React, { useState, useContext, useEffect } from 'react';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Toolbar, Box, Collapse, Tooltip
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

  // Debugging: Console mein check karo role kya aa raha hai
  const userRole = user?.role ? String(user.role).toLowerCase().trim() : '';
  console.log("Current User Role:", userRole);

  const [openReports, setOpenReports] = useState(false);
  const isActive = (path) => location.pathname === path;

  const NavItem = ({ icon, label, path }) => (
    <Tooltip title={!open ? label : ""} placement="right">
      <ListItem disablePadding sx={{ display: 'block', mb: 0.5 }}>
        <ListItemButton
          onClick={() => navigate(path)}
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
        [`& .MuiDrawer-paper`]: {
          width: open ? 240 : 70,
          overflowX: 'hidden',
          bgcolor: '#f4f4f4',
          display: 'flex',
          flexDirection: 'column'
        },
      }}
    >
      <Toolbar />

      <Box sx={{ flexGrow: 1, overflowY: 'auto', mt: 2 }}>
        <List>
          {(userRole === 'admin' || userRole === 'ccadmin' || userRole === 'brandadmin') && (
            <NavItem icon={<DashboardIcon />} label="Dashboard" path="/dashboard" />
          )}

          {/* 2. Users: SIRF Admin aur CCAdmin ko dikhao (BrandAdmin yahan block hai) */}
          {(userRole === 'admin' || userRole === 'ccadmin') && (
            <NavItem icon={<PeopleIcon />} label="Users" path="/users" />
          )}

          {/* 3. Stores & Items: Admin, CCAdmin, aur BrandAdmin ko dikhao */}
          {(userRole === 'admin' || userRole === 'ccadmin' || userRole === 'brandadmin') && (
            <>
              <NavItem icon={<StoreIcon />} label="Stores" path="/stores" />
              <NavItem icon={<InventoryIcon />} label="Items" path="/items" />
            </>
          )}

          {/* Reports Section Header: Sabko dikhao */}
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
                { name: 'Attendance Report', path: '/attendance-report', key: 'attendance' },
                { name: 'Daily Sales Report', path: '/sales-report', key: 'sales' },
                { name: 'Channel Sales Report', path: '/channelwisesummary-report', key: 'channel' },
                { name: 'Short Items Report', path: '/short-items-report', key: 'short' },
                { name: 'Interception Report', path: '/interception-report', key: 'interception' },
                { name: 'Short Tester Report', path: '/shorttester-report', key: 'tester' },
                { name: 'Expiry Stock Report', path: '/expirystock-report', key: 'expiry' },
              ]
                .filter((report) => {
                  // Admin aur CCAdmin ke liye sab kuch true (dikhayi dega)
                  if (userRole === 'admin' || userRole === 'ccadmin' || userRole === 'brandadmin') return true;

                  // Auditor: Sirf Attendance
                  if (userRole === 'auditor') return report.key === 'attendance';

                  // Supervisor (Hadeed): Sab reports magar Channel Sales nahi
                  if (userRole === 'supervisor') return report.key !== 'channel';

                  return false;
                })
                .map((report) => (
                  <ListItemButton
                    key={report.path}
                    onClick={() => navigate(report.path)}
                    selected={isActive(report.path)}
                    sx={{
                      pl: 4, my: 0.2, mx: 1, borderRadius: '8px',
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

      <Box sx={{ p: 2, mt: 'auto', textAlign: 'left' }}>
        <img src="/rivaj.png" alt="Logo" style={{ width: open ? '60%' : '50px' }} />
      </Box>
    </Drawer>
  );
};

export default Sidebar;