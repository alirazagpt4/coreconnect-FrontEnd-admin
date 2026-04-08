export const formatCompactNumber = (number) => {
    if (number === undefined || number === null) return "0";
    return new Intl.NumberFormat('en-US', {
        notation: "compact",
        compactDisplay: "short",
        maximumFractionDigits: 0
    }).format(number);
};