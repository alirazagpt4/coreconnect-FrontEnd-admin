import { Box, Typography } from "@mui/material";

const Footer = () => {
    return (
        <Box
            component="footer"
            sx={{
                py: 2,
                px: 3,

                textAlign: 'center',
                width: '100%',
            }}
        >
            <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>
                © {new Date().getFullYear()} <span style={{ color: '#1b2142' }}>CoreConnect</span> | Admin Dashboard
            </Typography>
        </Box>
    );
};

export default Footer