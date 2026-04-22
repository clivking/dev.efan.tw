import { createPrismaClient } from './prisma-client';

const prisma = createPrismaClient();
const reviewedAt = new Date('2026-04-22T15:30:00+08:00');
const publishedAt = new Date('2026-04-22T15:30:00+08:00');

type GuideUpdate = {
  slug: string;
  appendHtml: string;
};

const updates: GuideUpdate[] = [
  {
    slug: 'cctv-installation-planning-guide',
    appendHtml: `
<h2>延伸閱讀建議</h2>
<ul>
  <li><a href="/guides/cctv-system-pricing-guide">監視器價格怎麼算</a>：適合正在抓預算與比較報價的人。</li>
  <li><a href="/guides/cctv-storage-and-nvr-planning-guide">監視器容量、焦距與 NVR 怎麼一起規劃</a>：適合要把試算結果轉成採購規格的人。</li>
  <li><a href="/guides/office-cctv-system-guide">辦公室監視器怎麼選</a>：適合商辦與企業辦公場景。</li>
  <li><a href="/guides/taipei-cctv-installation-company-guide">台北監視器安裝公司怎麼選</a>：適合正在找在地施工與維護團隊的人。</li>
</ul>
`,
  },
  {
    slug: 'cctv-system-pricing-guide',
    appendHtml: `
<h2>延伸閱讀建議</h2>
<ul>
  <li><a href="/guides/cctv-installation-planning-guide">監視器安裝怎麼規劃</a>：適合先把整體任務與施工邏輯想清楚。</li>
  <li><a href="/guides/cctv-storage-and-nvr-planning-guide">監視器容量、焦距與 NVR 怎麼一起規劃</a>：適合把工具試算接回主機與硬碟配置。</li>
  <li><a href="/guides/cctv-recommendation-guide">監視器推薦怎麼看</a>：適合把場景與產品方向對起來。</li>
  <li><a href="/guides/taipei-cctv-installation-company-guide">台北監視器安裝公司怎麼選</a>：適合準備比廠商與正式詢價的人。</li>
</ul>
`,
  },
  {
    slug: 'office-cctv-system-guide',
    appendHtml: `
<h2>延伸閱讀建議</h2>
<ul>
  <li><a href="/guides/cctv-installation-planning-guide">監視器安裝怎麼規劃</a>：適合回到整體規劃順序。</li>
  <li><a href="/guides/cctv-system-pricing-guide">監視器價格怎麼算</a>：適合進一步抓預算與比較報價。</li>
  <li><a href="/guides/cctv-storage-and-nvr-planning-guide">監視器容量、焦距與 NVR 怎麼一起規劃</a>：適合把工具試算變成實際配置。</li>
  <li><a href="/guides/taipei-cctv-installation-company-guide">台北監視器安裝公司怎麼選</a>：適合商辦在地施工與維護評估。</li>
</ul>
`,
  },
  {
    slug: 'cctv-recommendation-guide',
    appendHtml: `
<h2>延伸閱讀建議</h2>
<ul>
  <li><a href="/guides/cctv-installation-planning-guide">監視器安裝怎麼規劃</a>：適合先把任務與施工條件釐清。</li>
  <li><a href="/guides/cctv-system-pricing-guide">監視器價格怎麼算</a>：適合把推薦方向接回預算判斷。</li>
  <li><a href="/guides/cctv-storage-and-nvr-planning-guide">監視器容量、焦距與 NVR 怎麼一起規劃</a>：適合進一步確認主機與硬碟方向。</li>
  <li><a href="/guides/office-cctv-system-guide">辦公室監視器怎麼選</a>：適合企業辦公場景。</li>
</ul>
`,
  },
  {
    slug: 'taipei-cctv-installation-company-guide',
    appendHtml: `
<h2>延伸閱讀建議</h2>
<ul>
  <li><a href="/guides/cctv-installation-planning-guide">監視器安裝怎麼規劃</a>：適合先把任務、鏡頭與施工邏輯想清楚。</li>
  <li><a href="/guides/cctv-system-pricing-guide">監視器價格怎麼算</a>：適合看報價與成本組成。</li>
  <li><a href="/guides/cctv-storage-and-nvr-planning-guide">監視器容量、焦距與 NVR 怎麼一起規劃</a>：適合把工具試算與正式規格接起來。</li>
  <li><a href="/guides/office-cctv-system-guide">辦公室監視器怎麼選</a>：適合台北商辦與企業辦公場景。</li>
</ul>
`,
  },
];

const clusterGuide = {
  slug: 'cctv-storage-and-nvr-planning-guide',
  title: '監視器容量、焦距與 NVR 怎麼一起規劃？把試算工具變成可採購規格',
  excerpt:
    '很多人會算監視器容量，也會抓鏡頭焦距，但真正困難的是怎麼把這些數字轉成可採購、可施工、可維護的配置。這篇整理焦距、保存天數、NVR 與硬碟怎麼一起看。',
  coverImage: '/images/portfolio/weshaire-ai-face-recognition.webp',
  content: `
<p>監視器規劃最常見的斷點，是知道自己大概需要幾 mm 鏡頭，也知道想保留幾天錄影，卻不知道這些結果要怎麼轉成實際的鏡頭、NVR 與硬碟配置。這也是很多企業明明做過試算，最後方案卻還是落不了地的原因。</p>
<p>如果你已經用過焦距或容量工具，這篇的目的就是把工具結果接回採購決策。真正能用的監視系統，不是單看焦距或單看容量，而是把鏡頭任務、NVR 通道數、錄影策略與未來擴充一起看。</p>

<h2>重點先看</h2>
<ul>
  <li><strong>焦距決定你看多寬、看多細：</strong>不先看任務就抓 mm，容易拍不到重點。</li>
  <li><strong>容量決定你留多久：</strong>解析度、FPS、錄影時數與保存天數都會影響硬碟需求。</li>
  <li><strong>NVR 決定整體管理體驗：</strong>通道數、回放效率與擴充彈性都在這裡。</li>
  <li><strong>三者要一起看：</strong>鏡頭、容量與主機分開看，最後常常會卡在整體不平衡。</li>
</ul>

<h2>先從焦距開始，不要先猜型號</h2>
<p>焦距的角色，是先幫你判斷入口、櫃台、走道或倉庫區該拍多寬、多細。這一步最適合先用 <a href="/tools/cctv-focal-length-calculator">監視器焦距計算器</a> 做初估，知道自己大概落在 2.8mm、4mm 還是更高焦段，再回頭看鏡頭型號。</p>

<h2>容量和保存天數怎麼對回硬碟</h2>
<p>容量的關鍵不是硬碟越大越好，而是你要在什麼解析度、FPS 與錄影時數下留幾天。這一步最適合用 <a href="/tools/cctv-storage-calculator">監視器容量計算器</a> 先抓方向，再把結果對回主機與硬碟顆數。</p>

<h2>工具結果要怎麼轉成實際配置</h2>
<table>
  <thead>
    <tr>
      <th>你已知的條件</th>
      <th>下一步要對回什麼</th>
      <th>常見產品方向</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>入口、櫃台需要中距離辨識</td>
      <td>焦距、逆光、鏡頭位置</td>
      <td><a href="/products/acti-z72">ACTi Z72</a></td>
    </tr>
    <tr>
      <td>夜間或低照度區域</td>
      <td>補光、低照度與保存需求</td>
      <td><a href="/products/acti-z722">ACTi Z722</a> / <a href="/products/acti-z53">ACTi Z53</a></td>
    </tr>
    <tr>
      <td>8 到 16 支鏡頭</td>
      <td>NVR 通道、PoE、硬碟顆數</td>
      <td><a href="/products/acti-znr-222p">ACTi ZNR-222P</a></td>
    </tr>
    <tr>
      <td>16 到 32 支以上</td>
      <td>回放效率、擴充與機櫃配置</td>
      <td><a href="/products/acti-znr-423">ACTi ZNR-423</a> / <a href="/products/acti-znr-424">ACTi ZNR-424</a></td>
    </tr>
  </tbody>
</table>

<h2>一帆安全整合怎麼把試算變成方案</h2>
<p>一帆安全整合在做監視規劃時，通常會先用場景把鏡頭任務切清楚，再用焦距與容量試算把範圍縮小，最後才對回鏡頭與 NVR。這樣的好處是，方案不會只停在大概夠，而會更接近實際可交付、可維護的配置。</p>

<h2>最常見的 4 個誤區</h2>
<ul>
  <li><strong>只算容量，不看焦距：</strong>結果錄很久，但畫面沒有辨識力。</li>
  <li><strong>只抓焦距，不看容量：</strong>結果畫面好看，但保存天數不夠。</li>
  <li><strong>只看鏡頭，不看主機：</strong>NVR 通道與回放體驗不夠，後面難擴充。</li>
  <li><strong>把工具結果當最終答案：</strong>工具適合初估，但正式採購仍要結合現場與施工條件。</li>
</ul>

<h2>延伸閱讀建議</h2>
<ul>
  <li><a href="/guides/cctv-installation-planning-guide">監視器安裝怎麼規劃</a>：先把任務、施工與整體順序建立起來。</li>
  <li><a href="/guides/cctv-system-pricing-guide">監視器價格怎麼算</a>：把試算結果接回預算與詢價。</li>
  <li><a href="/guides/cctv-recommendation-guide">監視器推薦怎麼看</a>：把場景與產品方向對起來。</li>
  <li><a href="/guides/office-cctv-system-guide">辦公室監視器怎麼選</a>：如果你的場景是企業辦公空間，這篇更貼近實務。</li>
  <li><a href="/guides/taipei-cctv-installation-company-guide">台北監視器安裝公司怎麼選</a>：如果你已經要進入詢價與找合作團隊，這篇更直接。</li>
</ul>

<h2>採購建議</h2>
<p>如果你已經有焦距與容量的初估結果，下一步就是把數字整理成鏡頭、主機、硬碟與施工條件的正式方案。你可以直接透過 <a href="/quote-request">詢價頁</a> 提供試算結果與場域資訊，讓一帆安全整合協助你完成設備建議與報價規格。</p>
`,
  contentType: 'guide' as const,
  targetKeyword: '監視器容量',
  searchIntent: 'commercial' as const,
  secondaryKeywords: ['監視器焦距', 'NVR 怎麼選', '監視器硬碟容量', '監視器保存天數', 'CCTV 容量規劃'],
  faq: [
    {
      question: '監視器容量和焦距要先看哪個？',
      answer: '通常先看場景與焦距，確認畫面任務，再回頭看容量與保存天數，這樣比較不會出現畫面和保存策略互相不平衡的情況。',
    },
    {
      question: 'NVR 通道數要剛好就好嗎？',
      answer: '多數企業案不建議抓到剛剛好，因為未來一旦想加鏡頭或調整架構，沒有預留空間會讓整體彈性變差。',
    },
    {
      question: '工具試算結果可以直接拿去採購嗎？',
      answer: '工具很適合做初步方向判斷，但正式採購仍要把現場光線、施工限制、回放需求與維護方式一起納入。',
    },
    {
      question: '辦公室監視器一定要自己算容量嗎？',
      answer: '不一定，但先理解保存天數與硬碟需求，會讓你在詢價和比較方案時更容易判斷哪些配置合理。',
    },
  ],
  relatedServiceSlugs: ['cctv', 'integration'],
  relatedProductSlugs: ['acti-z72', 'acti-z722', 'acti-z53', 'acti-znr-126', 'acti-znr-222p', 'acti-znr-423'],
  seoTitle: '監視器容量、焦距與 NVR 怎麼一起規劃？採購前完整整理｜一帆安全整合',
  seoDescription:
    '整理監視器容量、焦距與 NVR 怎麼一起看，幫助你把工具試算結果轉成可採購、可施工、可維護的監視系統規格。',
  sortOrder: 25,
};

async function appendClusterLinks(slug: string, appendHtml: string) {
  const existing = await prisma.guideArticle.findUnique({
    where: { slug },
    select: { id: true, content: true },
  });

  if (!existing) {
    console.warn(`Guide not found, skipped: ${slug}`);
    return;
  }

  const marker = '<h2>延伸閱讀建議</h2>';
  const nextContent = existing.content.includes(marker)
    ? `${existing.content.split(marker)[0].trim()}\n${appendHtml}`
    : `${existing.content.trim()}\n${appendHtml}`;

  await prisma.guideArticle.update({
    where: { slug },
    data: {
      content: nextContent,
      reviewedAt,
    },
  });

  console.log(`Updated cluster links: ${slug}`);
}

async function upsertClusterGuide() {
  const existing = await prisma.guideArticle.findUnique({
    where: { slug: clusterGuide.slug },
    select: { id: true },
  });

  await prisma.guideArticle.upsert({
    where: { slug: clusterGuide.slug },
    update: {
      title: clusterGuide.title,
      excerpt: clusterGuide.excerpt,
      coverImage: clusterGuide.coverImage,
      content: clusterGuide.content,
      contentGroup: 'guide',
      contentType: clusterGuide.contentType,
      topic: '監視與安防',
      targetKeyword: clusterGuide.targetKeyword,
      searchIntent: clusterGuide.searchIntent,
      secondaryKeywords: clusterGuide.secondaryKeywords,
      faq: clusterGuide.faq,
      authorName: '一帆安全整合',
      reviewedAt,
      relatedServiceSlugs: clusterGuide.relatedServiceSlugs,
      relatedProductSlugs: clusterGuide.relatedProductSlugs,
      legacyPath: null,
      redirectStatus: 'none',
      targetGuideSlug: null,
      seoTitle: clusterGuide.seoTitle,
      seoDescription: clusterGuide.seoDescription,
      isPublished: true,
      publishedAt,
      sortOrder: clusterGuide.sortOrder,
      updatedBy: null,
    },
    create: {
      slug: clusterGuide.slug,
      title: clusterGuide.title,
      excerpt: clusterGuide.excerpt,
      coverImage: clusterGuide.coverImage,
      content: clusterGuide.content,
      contentGroup: 'guide',
      contentType: clusterGuide.contentType,
      topic: '監視與安防',
      targetKeyword: clusterGuide.targetKeyword,
      searchIntent: clusterGuide.searchIntent,
      secondaryKeywords: clusterGuide.secondaryKeywords,
      faq: clusterGuide.faq,
      authorName: '一帆安全整合',
      reviewedAt,
      relatedServiceSlugs: clusterGuide.relatedServiceSlugs,
      relatedProductSlugs: clusterGuide.relatedProductSlugs,
      legacyPath: null,
      redirectStatus: 'none',
      targetGuideSlug: null,
      seoTitle: clusterGuide.seoTitle,
      seoDescription: clusterGuide.seoDescription,
      isPublished: true,
      publishedAt,
      sortOrder: clusterGuide.sortOrder,
      updatedBy: null,
    },
  });

  console.log(existing ? `Updated guide: ${clusterGuide.slug}` : `Created guide: ${clusterGuide.slug}`);
}

async function main() {
  for (const item of updates) {
    await appendClusterLinks(item.slug, item.appendHtml);
  }

  await upsertClusterGuide();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
