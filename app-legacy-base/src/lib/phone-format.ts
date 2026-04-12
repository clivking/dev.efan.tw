/**
 * 電話格式化工具
 * DB 存純數字，UI 顯示格式化
 */

// 去除所有非數字字元，但保留 # 作為分機分隔符
export function cleanPhone(input: string): string {
    if (!input) return '';
    // 將常見的分機關鍵字替換為 #
    let s = input.replace(/(分機|ext|extension|#|＃)/gi, '#');
    // 去除所有非 [數字 或 #] 的字元
    s = s.replace(/[^0-9#]/g, '');
    // 移除重複的 # 或開頭結尾的 #
    s = s.replace(/#+/g, '#').replace(/^#+|#+$/g, '');
    return s;
}

// 手機格式化：09XX-XXX-XXX
export function formatMobile(val: any): string {
    if (!val) return '';
    const digits = String(val).replace(/\D/g, '');
    if (digits.length < 10) return String(val);
    // 只取前10碼作為手機號碼
    const mobilePart = digits.slice(0, 10);
    return `${mobilePart.slice(0, 4)}-${mobilePart.slice(4, 7)}-${mobilePart.slice(7)}`;
}

// 市話格式化：依區碼自動判斷 + 分機處理
export function formatPhone(val: any): string {
    if (!val) return '';
    const cleaned = cleanPhone(String(val));
    if (!cleaned) return String(val);

    const parts = cleaned.split('#');
    const mainNumber = parts[0];
    const extension = parts[1];

    let formatted = mainNumber;
    const threeDigitAreaCodes = ['037', '049', '089', '082', '083', '036', '038'];

    if (mainNumber.startsWith('02') && mainNumber.length === 10) {
        formatted = `${mainNumber.slice(0, 2)}-${mainNumber.slice(2, 6)}-${mainNumber.slice(6)}`;
    } else {
        let matched = false;
        for (const code of threeDigitAreaCodes) {
            if (mainNumber.startsWith(code) && mainNumber.length === 10) {
                formatted = `${mainNumber.slice(0, 3)}-${mainNumber.slice(3, 6)}-${mainNumber.slice(6)}`;
                matched = true;
                break;
            }
        }
        if (!matched && mainNumber.length === 9 && /^0[3-8]/.test(mainNumber)) {
            formatted = `${mainNumber.slice(0, 2)}-${mainNumber.slice(2, 5)}-${mainNumber.slice(5)}`;
        }
    }

    return extension ? `${formatted} #${extension}` : formatted;
}

// 統編驗證：8 碼數字
export function validateTaxId(taxId: string): boolean {
    return /^\d{8}$/.test(taxId);
}

// 手機驗證：10 碼，09 開頭
export function validateMobile(mobile: string): boolean {
    const digits = cleanPhone(mobile);
    return /^09\d{8}$/.test(digits);
}

/**
 * 統一格式化入口
 */
export function formatPhoneNumber(val: any): string {
    if (!val) return '';
    const cleaned = cleanPhone(String(val));
    if (cleaned.startsWith('09')) {
        return formatMobile(val);
    }
    return formatPhone(val);
}
