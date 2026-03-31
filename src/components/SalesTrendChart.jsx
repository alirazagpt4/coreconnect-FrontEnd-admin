import { Typography, Box } from '@mui/material';
import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const SalesTrendChart = ({ data, categories }) => {
    const brandColors = {
        'AMRIJ': '#a855f7',
        'RHD': '#ec4899',
        'RIVAJ': '#f59e0b',
        'NO!MO!': '#10b981',
        'EVERNOYA': '#3b82f6'
    };

    // Helper function for formatting
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            maximumFractionDigits: 0, // Points khatam karne ke liye
        }).format(value);
    };

    if (!data || data.length === 0) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography variant="body2" color="textSecondary">No Data Available</Typography>
        </Box>
    );

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }} // Left margin thora barhaya hai
                barGap={4}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                    dy={10}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={80} // Width zaroori hai taake 2,333,333 pura nazar aaye
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                    tickFormatter={formatCurrency} // Yahan formatter apply kiya
                />
                <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    // 'name' yahan brand ka naam (e.g., AMRIJ, RIVAJ) automatically utha lega
                    formatter={(value, name) => [formatCurrency(value), name]}
                    contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                        fontSize: '12px'
                    }}
                />
                <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 700 }}
                />

                {categories.map((brand) => (
                    <Bar
                        key={brand}
                        dataKey={brand}
                        fill={brandColors[brand] || '#cbd5e1'}
                        radius={[3, 3, 0, 0]}
                        barSize={12}
                    />
                ))}
            </BarChart>
        </ResponsiveContainer>
    );
};

export default SalesTrendChart;