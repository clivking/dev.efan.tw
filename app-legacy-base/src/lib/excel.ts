import ExcelJS from 'exceljs';

function normalizeCellValue(value: ExcelJS.CellValue): string | number | boolean | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'object') {
        if ('text' in value && typeof value.text === 'string') return value.text;
        if ('result' in value) return normalizeCellValue(value.result as ExcelJS.CellValue);
        if ('richText' in value && Array.isArray(value.richText)) {
            return value.richText.map(part => part.text).join('');
        }
        if ('hyperlink' in value && typeof value.hyperlink === 'string') return value.text || value.hyperlink;
    }
    return String(value);
}

export async function loadWorkbookFromBuffer(buffer: ArrayBuffer | Buffer) {
    const workbook = new ExcelJS.Workbook();
    const source = buffer instanceof Buffer ? buffer : Buffer.from(new Uint8Array(buffer));
    await workbook.xlsx.load(source as any);
    return workbook;
}

export function worksheetToObjects(worksheet: ExcelJS.Worksheet): Record<string, string | number | boolean | null>[] {
    const headerRow = worksheet.getRow(1);
    const headers = headerRow.values as ExcelJS.CellValue[];
    const rows: Record<string, string | number | boolean | null>[] = [];

    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        const record: Record<string, string | number | boolean | null> = {};
        let hasValue = false;

        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const header = normalizeCellValue(headers[colNumber]);
            if (!header) return;

            const value = normalizeCellValue(cell.value);
            if (value !== null && value !== '') {
                hasValue = true;
            }
            record[String(header)] = value;
        });

        if (hasValue) {
            rows.push(record);
        }
    });

    return rows;
}

export function worksheetToMatrix(worksheet: ExcelJS.Worksheet): Array<Array<string | number | boolean | null>> {
    const rows: Array<Array<string | number | boolean | null>> = [];

    worksheet.eachRow({ includeEmpty: true }, (row) => {
        const values = row.values as ExcelJS.CellValue[];
        rows.push(values.slice(1).map((value) => normalizeCellValue(value)));
    });

    return rows;
}

export async function createWorkbookBuffer(
    sheetName: string,
    rows: Array<Record<string, string | number | null>>
) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    if (rows.length > 0) {
        const columns = Object.keys(rows[0]).map((key) => ({
            header: key,
            key,
            width: Math.max(12, String(key).length + 4),
        }));
        worksheet.columns = columns;
        worksheet.addRows(rows);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
}
