export const formatCompactNumber = (number) => {
    if (number === undefined || number === null) return "0";
    // Intl.NumberFormat use karein taake commas (1,234,567) sahi lagun
    return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0, // Paisa decimal mein nahi hota toh 0 rakhein
    }).format(number);
};