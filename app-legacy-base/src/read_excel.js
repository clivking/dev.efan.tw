const ExcelJS = require('exceljs');

async function readExcel() {
  const filePath = 'D:\\Desktop\\efan.tw-Merchant listings-2026-03-29.xlsx';

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    workbook.worksheets.forEach((worksheet) => {
      console.log(`--- Sheet: ${worksheet.name} ---`);
      const rows = [];
      const headers = [];

      worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
        headers[colNumber - 1] = cell.text || `Column ${colNumber}`;
      });

      worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        if (rowNumber === 1) return;

        const record = {};
        let hasValue = false;

        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const value = cell.text ?? '';
          if (value !== '') hasValue = true;
          record[headers[colNumber - 1]] = value;
        });

        if (hasValue) rows.push(record);
      });

      console.log(JSON.stringify(rows.slice(0, 20), null, 2));
    });
  } catch (error) {
    console.error('Error reading Excel file:', error.message);
  }
}

readExcel();
