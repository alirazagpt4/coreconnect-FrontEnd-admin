import React from 'react';
import {
    Box, Card, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Avatar, Stack
} from '@mui/material';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import { formatCompactNumber } from "../utils/formatter.js";

// Step 1: Accept the "data" prop from parent
const StoreWisePerformance = ({ data = [] }) => {
    return (
        <Card sx={{
            borderRadius: 4,
            p: 3,
            boxShadow: '0px 4px 20px rgba(0,0,0,0.05)',
            height: '470px', // Match other dashboard charts height
            width: '712px',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#fff'
        }}>
            {/* Header Area */}
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <Avatar sx={{ bgcolor: '#F3E5F5', color: '#A020F0', width: 32, height: 32, borderRadius: 1.5 }}>
                    <StorefrontOutlinedIcon sx={{ fontSize: 18 }} />
                </Avatar>
                <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1a203e', lineHeight: 1.2 }}>
                        Store-wise Performance
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Performance metrics by outlet
                    </Typography>
                </Box>
            </Stack>

            <TableContainer sx={{ flexGrow: 1, overflowY: 'auto' }}>
                {/* Step 2: Critical Fix - tableLayout fixed prevents horizontal scroll */}
                <Table size="small" stickyHeader sx={{ tableLayout: 'fixed' }}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: '#90a4ae', fontWeight: 800, fontSize: '0.65rem', width: '40%', bgcolor: '#fff' }}>
                                STORE - AREA
                            </TableCell>
                            <TableCell align="right" sx={{ color: '#90a4ae', fontWeight: 800, fontSize: '0.65rem', width: '20%', bgcolor: '#fff' }}>
                                REVENUE
                            </TableCell>
                            <TableCell align="right" sx={{ color: '#90a4ae', fontWeight: 800, fontSize: '0.65rem', width: '15%', bgcolor: '#fff' }}>
                                ITEMS
                            </TableCell>
                            <TableCell align="right" sx={{ color: '#90a4ae', fontWeight: 800, fontSize: '0.65rem', width: '25%', bgcolor: '#fff' }}>
                                INTERCEPTIONS
                            </TableCell>
                            <TableCell align="right" sx={{ color: '#90a4ae', fontWeight: 800, fontSize: '0.65rem', width: '15%', bgcolor: '#fff' }}>
                                CONV%
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.length > 0 ? data.map((row, index) => (
                            <TableRow key={index} hover>
                                <TableCell sx={{ py: 1.5 }}>
                                    <Typography variant="body2" sx={{
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        color: '#1a203e',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {/* Combined Store and Area with a dash */}
                                        {row.store_name} - <span style={{ color: '#90a4ae', fontWeight: 500 }}>{row.area}</span>
                                    </Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                    Rs {formatCompactNumber(Math.round(row.revenue))}
                                </TableCell>
                                <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                                    {row.items}
                                </TableCell>
                                <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600, textAlign: 'center' }}>
                                    {row.interceptions || 0}
                                </TableCell>
                                <TableCell align="right">
                                    <Box sx={{
                                        display: 'inline-block', px: 1, py: 0.2, borderRadius: 1, fontSize: '0.7rem', fontWeight: 800,
                                        bgcolor: parseFloat(row.conv_rate) > 40 ? '#e8f5e9' : '#fff3e0',
                                        color: parseFloat(row.conv_rate) > 40 ? '#2e7d32' : '#ed6c02'
                                    }}>
                                        {row.conv_rate}%
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={4} sx={{ py: 10, textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', opacity: 0.6 }}>
                                        No store data found
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Card>
    );
};

export default StoreWisePerformance;