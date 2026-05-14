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




export const handleExportToExcelWithFilters = async (data, fileName, filters) => {
    if (!data || data.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report', {
        views: [{ state: 'frozen', ySplit: 8 }] // Header aur Filters ko freeze kiya
    });

    const columnKeys = Object.keys(data[0]);
    const totalCols = columnKeys.length;

    // --- 1. BRANDING HEADER (Row 1-4) ---
    worksheet.mergeCells(1, 1, 4, totalCols);
    const titleCell = worksheet.getCell(1, 1);
    titleCell.value = fileName.toUpperCase();
    titleCell.font = { name: 'Segoe UI', size: 18, bold: true };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Logos Placement (Using your existing getBase64FromUrl logic)
    const logos = [{ url: '/rivaj.png', col: 0.02 }, { url: '/coreconnect.png', col: totalCols - 0.98 }];
    for (const logo of logos) {
        const base64 = await getBase64FromUrl(logo.url);
        if (base64) {
            const imgId = workbook.addImage({ base64, extension: 'png' });
            worksheet.addImage(imgId, { tl: { col: logo.col, row: 0.5 }, ext: { width: 110, height: 50 } });
        }
    }

    // --- 2. REPORT FILTERS HEADER (Row 5-7) ---
    // Hum 3 rows use karenge filters dikhane ke liye jaisa web portal par hai
    const filterRowStyle = {
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '1B2142' } },
        font: { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } },
        alignment: { vertical: 'middle', horizontal: 'left', indent: 1 },
        border: { all: { style: 'thin', color: { argb: 'FFFFFF' } } }
    };

    // Row 5: City & Channel
    worksheet.mergeCells(5, 1, 5, 2);
    worksheet.getCell(5, 1).value = `CITY: ${filters.city || 'ALL'}`;
    worksheet.mergeCells(5, 3, 5, 5);
    worksheet.getCell(5, 3).value = `CHANNEL: ${filters.channel || 'ALL'}`;
    worksheet.mergeCells(5, 6, 5, totalCols);
    worksheet.getCell(5, 6).value = `AREA: ${filters.area || 'ALL'}`;

    // Row 6: Store & Period
    worksheet.mergeCells(6, 1, 6, 2);
    worksheet.getCell(6, 1).value = `STORE: ${filters.store || 'ALL'}`;
    worksheet.mergeCells(6, 3, 6, totalCols);
    worksheet.getCell(6, 3).value = `PERIOD: ${filters.period}`;

    // Styling filter rows
    [5, 6].forEach(rowNum => {
        const row = worksheet.getRow(rowNum);
        row.height = 25;
        row.eachCell({ includeEmpty: true }, (cell) => {
            cell.fill = filterRowStyle.fill;
            cell.font = filterRowStyle.font;
            cell.alignment = filterRowStyle.alignment;
            cell.border = filterRowStyle.border;
        });
    });

    // Row 7: Empty Spacing Row (White)
    worksheet.getRow(7).height = 10;

    // --- 3. TABLE HEADERS (Row 8) ---
    const headerRow = worksheet.getRow(8);
    headerRow.height = 30;
    columnKeys.forEach((key, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = key.replace(/_/g, ' ').toUpperCase();
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1B2142' } };
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { all: { style: 'thin', color: { argb: '000000' } } };
    });

    // --- 4. DATA ROWS ---
    data.forEach((item, index) => {
        const rowValues = Object.values(item).map(val => {
            if (typeof val === 'string' && /^-?\d+(,\d+)*(\.\d+)?$/.test(val)) {
                return Number(val.replace(/,/g, ''));
            }
            return val;
        });

        const row = worksheet.addRow(rowValues);
        const isChannelLabel = String(item.STORE).includes('CHANNEL:');
        const isTotalRow = String(item.STORE).includes('TOTAL');

        row.eachCell((cell) => {
            if (typeof cell.value === 'number') cell.numFmt = '#,##0';
            cell.font = { name: 'Segoe UI', size: 10, bold: (isChannelLabel || isTotalRow) };

            // Zebra Striping + Highlight
            if (isChannelLabel) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F2F2' } };
            } else if (isTotalRow) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8E8E8' } };
            }

            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = { all: { style: 'thin' } };
        });
    });

    // Auto-Width Logic
    worksheet.columns.forEach(col => { col.width = 18; });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${fileName}.xlsx`);
};