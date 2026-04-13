import ExcelJS from 'exceljs';
import { createPrismaClient } from './prisma-client.mjs';

const prisma = createPrismaClient();

async function run() {
    console.log('Starting customer migration helper...');
    const filePath = 'D:\一帆AI\一帆報價V6\客戶完整匯入檔_系統版.xlsx';

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    workbook.worksheets.forEach((worksheet) => {
        console.log('Sheet: ' + worksheet.name + ', rows: ' + worksheet.rowCount);
    });

    console.log('Excel 檔已讀取完成，請再補上各工作表的欄位映射與寫入邏輯後再執行正式匯入。');
}

run()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
