/**
 * fix-phone-data.js
 * 清理聯絡人資料中手機與市話混放的情況，並移回正確欄位。
 *
 * 規則說明：
 * 1. 09 開頭且共 10 碼視為手機。
 * 2. 02 開頭的市話本體為 10 碼，超出的部分視為分機。
 * 3. 03~08 開頭的市話本體為 9 碼，超出的部分視為分機。
 * 4. 三碼區碼（037、049、089、082、083、036、038）本體為 10 碼。
 * 5. 若 phone 內包含分機但沒有 `#`，會補上 `#` 分隔符號。
 */

const { createPrismaClient } = require('./prisma-client.cjs');
const prisma = createPrismaClient();

const THREE_DIGIT_AREA_CODES = ['037', '049', '089', '082', '083', '036', '038'];
const TWO_DIGIT_AREA_CODES = ['02', '03', '04', '05', '06', '07', '08'];

/**
 * 判斷純數字字串是手機還是市話。
 * @returns {{ type: 'mobile' | 'landline' | 'unknown', mainNumber: string, extension: string | null }}
 */
function classifyNumber(digits) {
  if (!digits) return { type: 'unknown', mainNumber: '', extension: null };

  const clean = digits.replace(/\D/g, '');
  if (!clean) return { type: 'unknown', mainNumber: '', extension: null };

  if (/^09\d{8}$/.test(clean)) {
    return { type: 'mobile', mainNumber: clean, extension: null };
  }

  if (clean.startsWith('02')) {
    if (clean.length === 10) return { type: 'landline', mainNumber: clean, extension: null };
    if (clean.length > 10) return { type: 'landline', mainNumber: clean.slice(0, 10), extension: clean.slice(10) };
    return { type: 'landline', mainNumber: clean, extension: null };
  }

  for (const code of THREE_DIGIT_AREA_CODES) {
    if (clean.startsWith(code)) {
      if (clean.length === 10) return { type: 'landline', mainNumber: clean, extension: null };
      if (clean.length > 10) return { type: 'landline', mainNumber: clean.slice(0, 10), extension: clean.slice(10) };
      return { type: 'landline', mainNumber: clean, extension: null };
    }
  }

  for (const code of TWO_DIGIT_AREA_CODES) {
    if (code === '02') continue;
    if (clean.startsWith(code)) {
      if (clean.length === 9) return { type: 'landline', mainNumber: clean, extension: null };
      if (clean.length > 9) return { type: 'landline', mainNumber: clean.slice(0, 9), extension: clean.slice(9) };
      return { type: 'landline', mainNumber: clean, extension: null };
    }
  }

  return { type: 'unknown', mainNumber: clean, extension: null };
}

async function main() {
  const contacts = await prisma.contact.findMany({
    select: {
      id: true,
      name: true,
      mobile: true,
      phone: true,
      customer: {
        select: {
          customerNumber: true,
          companyNames: { where: { isPrimary: true }, select: { companyName: true } },
        },
      },
    },
  });

  let fixCount = 0;
  const changes = [];

  for (const contact of contacts) {
    const company = contact.customer?.companyNames?.[0]?.companyName || '(未提供公司)';
    const label = `[${contact.customer?.customerNumber}] ${company} | ${contact.name}`;

    let newMobile = contact.mobile;
    let newPhone = contact.phone;
    let changed = false;

    if (contact.mobile && !contact.phone) {
      const mobileDigits = contact.mobile.replace(/\D/g, '');
      const result = classifyNumber(mobileDigits);

      if (result.type === 'landline') {
        const phoneValue = result.extension ? `${result.mainNumber}#${result.extension}` : result.mainNumber;
        newMobile = null;
        newPhone = phoneValue;
        changed = true;
        console.log(`移動欄位: ${label}`);
        console.log(`  mobile "${contact.mobile}" 改判為市話，移到 phone "${phoneValue}"`);
      }
    }

    if (contact.phone && !contact.mobile) {
      const phoneDigits = contact.phone.replace(/\D/g, '');
      const result = classifyNumber(phoneDigits);

      if (result.type === 'mobile') {
        newMobile = result.mainNumber;
        newPhone = null;
        changed = true;
        console.log(`移動欄位: ${label}`);
        console.log(`  phone "${contact.phone}" 改判為手機，移到 mobile "${result.mainNumber}"`);
      }
    }

    if (contact.mobile && contact.phone) {
      const mobileResult = classifyNumber(contact.mobile.replace(/\D/g, ''));
      const phoneResult = classifyNumber(contact.phone.replace(/\D/g, ''));

      if (mobileResult.type === 'landline' && phoneResult.type === 'mobile') {
        const phoneValue = mobileResult.extension ? `${mobileResult.mainNumber}#${mobileResult.extension}` : mobileResult.mainNumber;
        newMobile = phoneResult.mainNumber;
        newPhone = phoneValue;
        changed = true;
        console.log(`對調欄位: ${label}`);
        console.log(`  mobile "${contact.mobile}" 與 phone "${contact.phone}" 對調修正`);
      }
    }

    if (!changed && contact.phone) {
      const phoneDigits = contact.phone.replace(/\D/g, '');
      const result = classifyNumber(phoneDigits);
      if (result.type === 'landline' && result.extension && !contact.phone.includes('#')) {
        const phoneValue = `${result.mainNumber}#${result.extension}`;
        newPhone = phoneValue;
        changed = true;
        console.log(`補分機: ${label}`);
        console.log(`  phone "${contact.phone}" 補成 "${phoneValue}"`);
      }
    }

    if (changed) {
      changes.push({
        id: contact.id,
        label,
        oldMobile: contact.mobile,
        oldPhone: contact.phone,
        newMobile,
        newPhone,
      });
      fixCount += 1;
    }
  }

  console.log('\n========================================');
  console.log(`已檢查 ${contacts.length} 筆聯絡人`);
  console.log(`需要修正 ${fixCount} 筆`);
  console.log('========================================\n');

  if (changes.length === 0) {
    console.log('資料已經乾淨，沒有需要修正的電話欄位。');
    return;
  }

  console.log('開始批次更新...\n');
  let successCount = 0;

  for (const change of changes) {
    try {
      await prisma.contact.update({
        where: { id: change.id },
        data: {
          mobile: change.newMobile,
          phone: change.newPhone,
        },
      });
      successCount += 1;
    } catch (error) {
      console.error(`更新失敗: ${change.label}`, error.message);
    }
  }

  console.log(`\n更新完成：${successCount}/${changes.length} 筆成功`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
