const { createPrismaClient } = require('./prisma-client.cjs');
const p = createPrismaClient();

const descriptions = {
  'AR-0090M': 'AR-0090M 靜音型陽極鎖',
  'AR-0100M': 'AR-0100M 標準型陽極鎖',
  'AR-1207B': 'AR-1207B 智慧防撬陽極鎖（送電開門）',
  'AR-0180M': 'AR-0180M 180kg 磁力鎖',
  'AR-0300M': 'AR-0300M 300kg 磁力鎖',
  'AR-0330M': 'AR-0330M 330kg 加強型磁力鎖',
  'AR-0400WF': 'AR-0400WF 400lb 防水磁力鎖',
  'AR-0400WS': 'AR-0400WS 400lb 標準磁力鎖',
  'AR-0600M-WPF': 'AR-0600M-WPF 600lb 防水磁力鎖',
  'AR-0600M-270': 'AR-0600M-270 600lb 標準磁力鎖',
  'AR-0600M-DB-540': 'AR-0600M-DB-540 對開門雙磁力鎖',
  'AR-1306': 'AR-1306 標準型陰極鎖',
  'AR-1304-S': 'AR-1304-S 短面板陰極鎖',
  'AR-1304-SL': 'AR-1304-SL 長面板陰極鎖',
  'AR-YS-131NO': 'AR-YS-131NO 斷電開門陰極鎖',
  'AR-YS-130NO': 'AR-YS-130NO 經濟型斷電開門陰極鎖',
  'AR-1211P': 'AR-1211P 電子櫥櫃鎖',
  'AR-1213P': 'AR-1213P 大型電子櫥櫃鎖',
  'AR-323-D': 'AR-323-D 門禁控制鍵盤',
  'AR-101-PBI-E': 'AR-101-PBI-E 紅外線感應開門按鈕（窄版）',
  'AR-101-PBI-S': 'AR-101-PBI-S 紅外線感應開門按鈕（方版）',
  'AR-PB-6ABR': 'AR-PB-6ABR 不鏽鋼觸控開門按鈕',
  'AR-PB5': 'AR-PB5 不鏽鋼機械式開門按鈕',
  'AR-901V02': 'AR-901V02 語音播報模組',
  'AR-901A01': 'AR-901A01 門禁搭配攝影模組',
  'AR-MDL-POE-12V12W': 'AR-MDL-POE-12V12W PoE 供電隔離模組',
  'AR-TAGCI8W50F': 'AR-TAGCI8W50F 防水圓形感應貼紙',
  'AR-TAGCI': 'AR-TAGCI 標準感應標籤',
  'AR-TAGCI3W50-MASTER': 'AR-TAGCI3W50-MASTER 管理母卡',
  'AR-TAGK7': 'AR-TAGK7 大型感應鑰匙圈',
  'AR-TAGK3': 'AR-TAGK3 標準感應鑰匙圈',
  'AR-TAGK33W20F-MF06': 'AR-TAGK33W20F-MF06 Mifare 感應鑰匙圈',
  'AR-TAGK1': 'AR-TAGK1 迷你感應鑰匙圈',
  'AR-TAGJ': 'AR-TAGJ 感應手環',
  'AR-BE-180/078': 'AR-BE-180/078 陰極鎖安裝支架',
  'AR-BU-078/180': 'AR-BU-078/180 陰極鎖 U 型支架',
  'AR-0600M-U': 'AR-0600M-U 600lb 磁力鎖 U 型支架',
  'AR-0600M-UA': 'AR-0600M-UA 600lb 磁力鎖 UA 型支架',
  'AR-MA-46190': 'AR-MA-46190 門禁安裝支架',
  'AR-0600MZL-WP': 'AR-0600MZL-WP 600lb 防水 ZL 支架',
  'AR-0600MZL': 'AR-0600MZL 600lb ZL 支架',
  'AR-0600MZU': 'AR-0600MZU 600lb ZU 支架',
  'AR-0300MZL': 'AR-0300MZL 300lb ZL 支架',
  'AR-0400MZL': 'AR-0400MZL 400lb ZL 支架',
  'AR-0300M-U': 'AR-0300M-U 300lb 磁力鎖 U 型支架',
  'AR-816RB': 'AR-816RB 繼電器模組',
  'AR-829RB': 'AR-829RB 繼電器模組',
  'AR-721RB': 'AR-721RB 繼電器模組',
  'AR-821RB': 'AR-821RB 繼電器模組',
  'AR-MDL-BLE5': 'AR-MDL-BLE5 藍牙模組',
  'AR-321DAX1': 'AR-321DAX1 TTL 轉 RS-485 內建模組',
  'AR-321L485-5V': 'AR-321L485-5V TTL 轉 RS-485 模組（5V）',
  'AR-321L485-12V': 'AR-321L485-12V TTL 轉 RS-485 模組（12V）',
  'AR-321L232-5V': 'AR-321L232-5V TTL 轉 RS-232 模組（5V）',
  'AR-727-CM-IO-0804R': 'AR-727-CM-IO-0804R I/O 聯網控制器（8DI/4DO）',
  'AR-727-CM-PLC-0804R': 'AR-727-CM-PLC-0804R PLC 聯網控制器',
  'AR-727-CM-IO-UDP Fire Release': 'AR-727-CM-IO-UDP 消防連動模組',
  'AR-321-CM': 'AR-321-CM USB 轉 RS-485 模組',
};

async function main() {
  let count = 0;

  for (const [model, description] of Object.entries(descriptions)) {
    const product = await p.product.findFirst({
      where: { model, brand: 'SOYAL', isDeleted: false },
    });

    if (!product) {
      console.log(`NOT FOUND: ${model}`);
      continue;
    }

    await p.product.update({
      where: { id: product.id },
      data: { description },
    });

    console.log(`OK: ${description}`);
    count += 1;
  }

  console.log(`\nUpdated: ${count} products`);
}

main()
  .catch((error) => console.error(error))
  .finally(() => p.$disconnect());
