import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const getBase64FromUrl = async (url) => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => resolve(reader.result);
        });
    } catch (e) { return null; }
};

export const handleExportToExcel = async (data, fileName) => {
    if (!data || data.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report', {
        views: [{ state: 'frozen', ySplit: 5 }] // Row 5 tak freeze (Scroll karne par header nahi jayega)
    });

    const columnKeys = Object.keys(data[0]);
    const totalCols = columnKeys.length;

    // --- 1. BRANDING HEADER (Row 1-4) ---
    worksheet.mergeCells(1, 1, 4, totalCols);
    const titleCell = worksheet.getCell(1, 1);
    titleCell.value = fileName.toUpperCase();
    titleCell.font = { name: 'Segoe UI', size: 18, bold: true, color: { argb: '000000' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.border = {
        top: { style: 'medium' }, left: { style: 'medium' },
        bottom: { style: 'medium' }, right: { style: 'medium' }
    };

    // Logos Placement
    const logos = [
        { url: '/rivaj.png', col: 0.02 },
        { url: '/coreconnect.png', col: totalCols - 0.98 }
    ];

    for (const logo of logos) {
        const base64 = await getBase64FromUrl(logo.url);
        if (base64) {
            const imgId = workbook.addImage({ base64, extension: 'png' });
            worksheet.addImage(imgId, {
                tl: { col: logo.col, row: 0.5 },
                ext: { width: 110, height: 50 }
            });
        }
    }

    // --- 2. TABLE HEADERS (Row 5) ---
    const headerRow = worksheet.getRow(5);
    headerRow.height = 30;
    columnKeys.forEach((key, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = key.replace(/_/g, ' ').toUpperCase();
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1B2142' } };
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { all: { style: 'thin', color: { argb: '000000' } } };
    });

    // Auto-Filter Enable karein (User excel mein filter kar sakega)
    worksheet.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: totalCols } };

    // --- 3. DATA ROWS WITH ZEBRA STRIPING ---
    data.forEach((item, index) => {
        // Step A: Pehle data ko raw number mein convert karein (agar frontend se comma aa raha hai toh)
        const rowValues = Object.values(item).map(val => {
            if (typeof val === 'string' && /^-?\d+(,\d+)*(\.\d+)?$/.test(val)) {
                return Number(val.replace(/,/g, ''));
            }
            return val;
        });

        const row = worksheet.addRow(rowValues);
        row.height = 22;

        const rowFillColor = (index % 2 === 0) ? 'FFFFFF' : 'F2F2F2';

        row.eachCell((cell) => {
            // Step B: Agar cell mein number hai, toh comma lagao (No Decimals)
            if (typeof cell.value === 'number') {
                cell.numFmt = '#,##0';
            }

            cell.font = { name: 'Segoe UI', size: 10 };
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowFillColor } };
            cell.border = {
                top: { style: 'thin', color: { argb: '000000' } },
                left: { style: 'thin', color: { argb: '000000' } },
                bottom: { style: 'thin', color: { argb: '000000' } },
                right: { style: 'thin', color: { argb: '000000' } }
            };
        });
    });

    // --- 5. DYNAMIC COLUMN WIDTH & WRAP TEXT LOGIC ---
    worksheet.columns.forEach((column) => {
        let maxColumnLength = 0;

        column.eachCell({ includeEmpty: true }, (cell) => {
            // Header (Row 5) aur Data Cells dono ki length check karein
            const cellValue = cell.value ? cell.value.toString() : "";
            const columnLength = cellValue.length;

            if (columnLength > maxColumnLength) {
                maxColumnLength = columnLength;
            }

            // PRODUCT NAME wale column ke liye wrapping on karein
            // Agar text 40 characters se bara ho toh wrap karein
            cell.alignment = {
                vertical: 'middle',
                horizontal: 'center',
                wrapText: true // Yeh lamba text niche wali line mein le ayega
            };
        });

        // Professional Width Logic
        // Agar text bohot lamba hai toh max width 50 rakhein, warna dynamic
        let dynamicWidth = maxColumnLength + 5;
        if (dynamicWidth > 50) {
            column.width = 50; // Max limit taake sheet bikhre na
        } else if (dynamicWidth < 15) {
            column.width = 15; // Min limit taake header saaf dikhe
        } else {
            column.width = dynamicWidth;
        }
    });

    // Row height ko auto adjust hone dein taake wrapped text nazar aaye
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 5) { // Data rows ke liye
            row.height = undefined; // Excel ko khud manage karne dein (Auto-fit height)
        }
    });

    // --- 6. SAVE ---
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${fileName}.xlsx`);
};