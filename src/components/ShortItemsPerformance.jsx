import React, { useMemo } from 'react';
import { Box, Typography, Paper, Chip, Divider } from '@mui/material';
import { Inventory2Outlined as ShortItemsIcon } from '@mui/icons-material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

const ShortItemsPerformance = ({ responseData }) => {
    const brandColors = {
        'AMRIJ': '#a855f7',
        'RHD': '#ec4899',
        'RIVAJ': '#f59e0b',
        'NO!MO!': '#10b981',
        'EVERNOYA': '#3b82f6'
    };

    const groupedItems = useMemo(() => {
        if (!responseData?.data) return [];
        const counts = responseData.data.reduce((acc, curr) => {
            const id = curr.item_id;
            if (!acc[id]) {
                acc[id] = {
                    name: curr.itemInfo.product_name,
                    category: curr.category_name?.toUpperCase(),
                    store: curr.store_name,
                    area: curr.area,
                    ba: curr.ba_name,
                    count: 0
                };
            }
            acc[id].count += 1;
            return acc;
        }, {});
        return Object.values(counts).sort((a, b) => b.count - a.count);
    }, [responseData]);

    return (
        <Paper elevation={0} sx={{
            p: 2, borderRadius: '16px', border: '1px solid #eef2f6',
            bgcolor: '#fff', height: '420px', width: '490px', display: 'flex', flexDirection: 'column'
        }}>
            {/* Header: Compact & Complete */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{
                        p: 0.6, borderRadius: '8px', bgcolor: '#fff4e5', color: '#ff8f00',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <ShortItemsIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', }}>
                        <Typography sx={{ fontWeight: 800, color: '#1a203e', fontSize: '0.75rem' }}>
                            Short Items
                        </Typography>
                        <Typography sx={{ color: '#90a4ae', fontSize: '0.6rem', fontWeight: 700, mt: 0.2, display: 'block' }}>
                            Out-of-stock demand
                        </Typography>

                    </Box>


                </Box>

                <Box sx={{ textAlign: 'right' }}>
                    <Chip
                        label={`${responseData?.summary?.uniqueSKUs || 0} SKUs`}
                        size="small"
                        sx={{ bgcolor: '#fff8e1', color: '#ff8f00', fontWeight: 800, borderRadius: '4px', height: '18px', fontSize: '0.6rem' }}
                    />
                    {/* Fixed: Restored Requests Text */}
                    <Typography sx={{ color: '#90a4ae', fontSize: '0.6rem', fontWeight: 700, mt: 0.2, display: 'block' }}>
                        {responseData?.summary?.totalRequests || 0} Requests
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ mb: 1.5, opacity: 0.3 }} />

            {/* List Section: Ultra Dense */}
            <Box sx={{
                flexGrow: 1, overflowY: 'auto', pr: 0.5,
                '&::-webkit-scrollbar': { width: '3px' },
                '&::-webkit-scrollbar-thumb': { bgcolor: '#f1f1f1', borderRadius: '10px' }
            }}>
                {groupedItems.map((item, index) => {
                    const brandColor = brandColors[item.category] || '#64748b';

                    return (
                        <Box key={index} sx={{
                            display: 'flex', alignItems: 'center', mb: 0.8, p: 1,
                            bgcolor: '#fff9f0', borderRadius: '8px', border: '1px solid #fff3e0'
                        }}>
                            {/* Demand Count - Shrunk */}
                            <Box sx={{
                                minWidth: '28px', height: '28px', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                bgcolor: '#ffecb3', color: '#b26a00',
                                fontWeight: 900, fontSize: '0.8rem', borderRadius: '6px', mr: 1.2
                            }}>
                                <FiberManualRecordIcon sx={{ fontSize: '12px', color: item.color }} />
                            </Box>

                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 700, color: '#1a203e', fontSize: '0.75rem', noWrap: true, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {item.name}
                                </Typography>
                                <Typography sx={{ color: '#78909c', fontSize: '0.65rem', fontWeight: 600 }}>
                                    {item.store} • {item.area}
                                </Typography>
                            </Box>

                            {/* Brand Chip - Ultra Compact */}
                            <Chip
                                label={item.category}
                                size="small"
                                sx={{
                                    fontWeight: 800, fontSize: '0.5rem',
                                    bgcolor: brandColor, color: '#fff',
                                    height: '16px', px: 0, borderRadius: '3px'
                                }}
                            />
                        </Box>
                    );
                })}
            </Box>
        </Paper>
    );
};

export default ShortItemsPerformance;