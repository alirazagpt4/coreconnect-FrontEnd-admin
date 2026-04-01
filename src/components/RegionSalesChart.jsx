import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Box, Typography } from '@mui/material';

// Tumhare image wale colors (Purple aur Pink)
const COLORS = ['#9c27b0', '#e91e63', '#673ab7', '#2196f3', '#00bcd4'];

const RegionSalesChart = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="caption" color="textSecondary">No data for this range</Typography>
            </Box>
        );
    }

    // Y-Axis labels ko "K" (Thousands) mein convert karne ke liye function
    const formatYAxis = (value) => {
        if (value === 0) return '0K';
        return `${(value / 1000).toLocaleString()}K`;
    };

    // Tooltip mein poori value dikhane ke liye
    const formatTooltip = (value) => `Rs ${Math.round(value).toLocaleString()}`;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                barSize={40} // Bar ki thickness image ke mutabiq
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />

                <XAxis
                    dataKey="region"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#90a4ae', fontSize: 12, fontWeight: 600 }}
                    dy={10}
                />

                <YAxis
                    tickFormatter={formatYAxis}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#90a4ae', fontSize: 12, fontWeight: 600 }}
                />

                <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    formatter={(value) => [formatTooltip(value), 'Revenue']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />

                <Bar dataKey="revenue" radius={[10, 10, 0, 0]}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};

export default RegionSalesChart;