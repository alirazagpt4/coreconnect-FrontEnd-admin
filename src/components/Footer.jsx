import { Box  , Typography} from "@mui/material";

const Footer = () => {
    return (
        <Box
            component="footer"
            sx={{
                py: 2,
                px: 3,
                backgroundColor: '#ffffff',
                borderTop: '1px solid #e0e0e0',
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