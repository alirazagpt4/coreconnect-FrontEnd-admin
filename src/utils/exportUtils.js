import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const handleExportToExcel = async (data, fileName) => {
    if (!data || data.length === 0) {
        alert("Data khali hai!");
        return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    // 1. Headers Define Karein (Keys mapping)
    const columns = Object.keys(data[0]).map(key => ({
        header: key,
        key: key,
        width: 20 // Default width
    }));
    worksheet.columns = columns;

    // 2. Data Add Karein
    worksheet.addRows(data);

    // 3. HEADER STYLING (Blue Background, White Bold Text)
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '1B2142' } // Aapka Sidebar wala Dark Blue color
        };
        cell.font = {
            name: 'Arial',
            size: 11,
            bold: true,
            color: { argb: 'FFFFFF' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    // 4. DATA CELLS STYLING (Borders aur Alignment)
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Header ke ilawa baaki rows
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });
        }
    });

    // 5. AUTO-WIDTH LOGIC
    worksheet.columns.forEach(column => {
        let maxColumnLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
            const columnLength = cell.value ? cell.value.toString().length : 0;
            if (columnLength > maxColumnLength) {
                maxColumnLength = columnLength;
            }
        });
        column.width = maxColumnLength < 12 ? 12 : maxColumnLength + 5;
    });

    // 6. Generate & Save File
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
};