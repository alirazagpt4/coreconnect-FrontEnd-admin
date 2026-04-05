import React from 'react';
import {
    Box,
    Card,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Avatar,
    Stack,
    Divider
} from '@mui/material';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';

const StoreWisePerformance = () => {
    return (
        <Card sx={{
            borderRadius: 4,
            p: 3,
            boxShadow: '0px 4px 20px rgba(0,0,0,0.05)',
            height: '100%',
            width:'100%',
            minHeight: '400px' // Placeholder height
        }}>
            {/* Header Area */}
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
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

            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                            <TableCell sx={{ color: '#90a4ae', fontWeight: 800, fontSize: '0.65rem', py: 1.5, borderBottom: '2px solid #f0f0f0' }}>
                                STORE NAME
                            </TableCell>
                            <TableCell align="right" sx={{ color: '#90a4ae', fontWeight: 800, fontSize: '0.65rem', borderBottom: '2px solid #f0f0f0' }}>
                                REVENUE
                            </TableCell>
                            <TableCell align="right" sx={{ color: '#90a4ae', fontWeight: 800, fontSize: '0.65rem', borderBottom: '2px solid #f0f0f0' }}>
                                ITEMS
                            </TableCell>
                            <TableCell align="right" sx={{ color: '#90a4ae', fontWeight: 800, fontSize: '0.65rem', borderBottom: '2px solid #f0f0f0' }}>
                                INTERCEPTIONS
                            </TableCell>
                            <TableCell align="right" sx={{ color: '#90a4ae', fontWeight: 800, fontSize: '0.65rem', borderBottom: '2px solid #f0f0f0' }}>
                                CONVERSION %
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {/* Empty Body - No Data Rows */}
                        <TableRow>
                            <TableCell colSpan={5} sx={{ py: 10, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', opacity: 0.6 }}>
                                    Waiting for backend data...
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Card>
    );
};

export default StoreWisePerformance;