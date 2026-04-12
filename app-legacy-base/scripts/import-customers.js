const ExcelJS = require('exceljs');
const { createPrismaClient } = require('./prisma-client.cjs');

const prisma = createPrismaClient();
const EXCEL_PATH = 'd:\一帆AI\一帆報價V6\scripts\客戶資料匯入_最終確認版.xlsx';

function text(value) {
  return value == null ? '' : String(value).trim();
}

async function importData() {
  console.log('--- 讀取客戶匯入資料 ---');

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(EXCEL_PATH);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) throw new Error('Worksheet not found');

    const headers = [];
    worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
      headers[colNumber - 1] = text(cell.value);
    });

    const rows = [];
    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      const record = {};
      let hasValue = false;
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const value = text(cell.value);
        if (value) hasValue = true;
        record[headers[colNumber - 1] || 'col_' + colNumber] = value;
      });
      if (hasValue) rows.push(record);
    });

    console.log('讀到 ' + rows.length + ' 筆資料。若要正式匯入，請再補上欄位映射與寫入邏輯。');
  } catch (error) {
    console.error('匯入失敗：', error);
  } finally {
    await prisma.$disconnect();
  }
}

importData();
