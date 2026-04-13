const { createPrismaClient } = require('./prisma-client.cjs');
const p = createPrismaClient();

const descriptions = {
  Y31: 'Y31 2MP 迷你子彈型攝影機',
  Y32: 'Y32 5MP 迷你子彈型攝影機',
  Y71: 'Y71 2MP 迷你半球型攝影機',
  Y72: 'Y72 5MP 迷你半球型攝影機',
  'YVR-120': 'YVR-120 6 路迷你混合式 DVR 主機',
  'YVR-121': 'YVR-121 12 路迷你混合式 DVR 主機',
  'YVR-122': 'YVR-122 24 路迷你混合式 DVR 主機',
  'Z319 / Z332': 'Z319/Z332 5MP AI 子彈型攝影機',
  'Z330 / Z330-P1': 'Z330/Z330-P1 2MP AI 子彈型攝影機',
  'Z331 / Z331-P1': 'Z331/Z331-P1 4MP AI 子彈型攝影機',
  Z412: 'Z412 2MP AI 變焦子彈型攝影機',
  'Z53 / Z512': 'Z53/Z512 5MP AI 半球型攝影機',
  'Z722 / Z511': 'Z722/Z511 4MP AI 半球型攝影機',
  'Z72 / Z79': 'Z72/Z79 4MP AI 海螺型攝影機',
  'Z78 / Z510': 'Z78/Z510 2MP AI 半球型攝影機',
  'Z85 / Z812': 'Z85/Z812 2MP AI 變焦半球型攝影機',
  Z910: 'Z910 2MP AI 迷你半球型攝影機',
  Z911: 'Z911 4MP AI 迷你半球型攝影機',
  Z912: 'Z912 5MP AI 迷你半球型攝影機',
  Z958: 'Z958 2MP AI 25 倍快速球攝影機',
  'ZNR-126': 'ZNR-126 8 路迷你 NVR 主機',
  'ZNR-127 / ZNR-129': 'ZNR-127/ZNR-129 16 路迷你 NVR 主機',
  'ZNR-222P': 'ZNR-222P 16 路 PoE NVR 主機',
  'ZNR-423 / ZNR-425': 'ZNR-423/ZNR-425 32 路 PoE NVR 主機',
  'ZNR-424': 'ZNR-424 64 路 PoE NVR 主機',
};

async function main() {
  let count = 0;

  for (const [model, description] of Object.entries(descriptions)) {
    const product = await p.product.findFirst({
      where: { model, isDeleted: false },
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

  console.log(`\nUpdated: ${count}`);
}

main()
  .catch((error) => console.error(error))
  .finally(() => p.$disconnect());
