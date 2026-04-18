import { Typography, Box } from '@mui/material';
import React, { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const SalesTrendChart = ({ data, categories }) => {

    const brandColors = {
        'RIVAJ': '#f59e0b',
        'AMRIJ': '#a855f7',
        'RHD': '#ec4899',
        'NO!MO!': '#10b981',
        'EVERNOYA': '#3b82f6',
    };

    const priorityOrder = ['RIVAJ', 'AMRIJ', 'RHD', 'NO!MO!', 'EVERNOYA'];

    const sortedCategories = useMemo(() => {
        return [...categories].sort((a, b) => {
            return priorityOrder.indexOf(a) - priorityOrder.indexOf(b);
        });
    }, [categories]);

    const barSize = useMemo(() => {
        if (!data) return 12;
        const count = data.length;
        if (count <= 7) return 20;
        if (count <= 14) return 14;
        if (count <= 21) return 10;
        return 7;
    }, [data]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            maximumFractionDigits: 0,
        }).format(value);
    };

    if (!data || data.length === 0) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography variant="body2" color="textSecondary">No Data Available</Typography>
        </Box>
    );

    return (
        <ResponsiveContainer width="100%" height={320}>
            <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                barCategoryGap="50%"
                barGap={2}
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
                    width={80}
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                    tickFormatter={formatCurrency}
                />
                <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    formatter={(value, name) => [formatCurrency(value), name]}
                    contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                        fontSize: '12px'
                    }}
                />
                <Legend
                    content={() => (
                        <ul style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '20px',
                            listStyle: 'none',
                            padding: 0,
                            marginTop: '20px',
                            fontSize: '11px',
                            fontWeight: 700
                        }}>
                            {sortedCategories.map((brand) => (
                                <li key={`legend-${brand}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        backgroundColor: brandColors[brand]
                                    }} />
                                    <span style={{ color: '#64748b' }}>{brand}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                />
                {sortedCategories.map((brand) => (
                    <Bar
                        key={brand}
                        dataKey={brand}
                        fill={brandColors[brand] || '#cbd5e1'}
                        radius={[3, 3, 0, 0]}
                        barSize={barSize}
                        isAnimationActive={true}
                    />
                ))}
            </BarChart>
        </ResponsiveContainer>
    );
};

export default SalesTrendChart;