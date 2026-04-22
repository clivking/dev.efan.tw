import { createPrismaClient } from './prisma-client';

const prisma = createPrismaClient();
const publishedAt = new Date('2026-04-22T17:00:00+08:00');
const reviewedAt = new Date('2026-04-22T17:00:00+08:00');

type FaqItem = {
  question: string;
  answer: string;
};

type GuideSeed = {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  content: string;
  contentType: 'guide' | 'comparison' | 'faq' | 'case-study';
  targetKeyword: string;
  searchIntent: 'commercial' | 'transactional';
  secondaryKeywords: string[];
  faq: FaqItem[];
  relatedServiceSlugs: string[];
  relatedProductSlugs: string[];
  seoTitle: string;
  seoDescription: string;
  sortOrder: number;
};

const guides: GuideSeed[] = [
  {
    slug: 'office-cctv-case-planning-guide',
    title: '辦公室監視器案例怎麼看？從死角、錄影保存到可維護架構的規劃重點',
    excerpt:
      '企業在看監視器案例時，不應只看完工照片，而要看場域問題、鏡頭任務、錄影保存與後續維護有沒有一起被解決。這篇用案例角度整理辦公室監視規劃該怎麼判斷。',
    coverImage: '/images/portfolio/weshaire-ai-face-recognition.webp',
    content: `
<p>辦公室監視器案例真正有價值的地方，不是照片看起來有沒有很多鏡頭，而是能不能看懂這個案場原本的問題、最後怎麼規劃，以及這套系統未來好不好維護。對企業來說，能不能複製到自己的場景，比單純看完工畫面更重要。</p>
<p>所以在看監視器案例時，建議不要只問裝了幾支，而是問入口、櫃台、走道、倉庫與夜間場景各自怎麼處理，錄影保存幾天、調閱怎麼做、主機與網路怎麼留擴充。這些才是真正影響使用體驗的地方。</p>

<h2>看辦公室監視器案例時，先看哪 4 件事</h2>
<ul>
  <li><strong>原本問題是什麼：</strong>死角、逆光、保存不夠，還是調閱流程混亂。</li>
  <li><strong>鏡頭任務怎麼分：</strong>哪些鏡頭是辨識，哪些是追查，哪些是夜間留證。</li>
  <li><strong>NVR 與保存怎麼做：</strong>是否把硬碟、保存天數與回放需求一起想清楚。</li>
  <li><strong>後續好不好維護：</strong>若未來加鏡頭、搬樓層或調整權限，會不會很麻煩。</li>
</ul>

<h2>常見企業案例的規劃邏輯</h2>
<table>
  <thead>
    <tr>
      <th>場景</th>
      <th>常見問題</th>
      <th>規劃方向</th>
      <th>對應產品方向</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>入口 / 櫃台</td>
      <td>逆光、爭議回查困難</td>
      <td>先處理辨識角度與反光</td>
      <td><a href="/products/acti-z72">ACTi Z72</a></td>
    </tr>
    <tr>
      <td>走道 / 公共區</td>
      <td>事件動線斷掉</td>
      <td>鏡頭銜接與回放效率優先</td>
      <td><a href="/products/acti-z722">ACTi Z722</a></td>
    </tr>
    <tr>
      <td>倉庫 / 設備區</td>
      <td>夜間畫面不穩、保存不足</td>
      <td>低照度與保存天數一起算</td>
      <td><a href="/products/acti-z53">ACTi Z53</a></td>
    </tr>
    <tr>
      <td>中型辦公室</td>
      <td>回放慢、擴充受限</td>
      <td>預留通道與硬碟空間</td>
      <td><a href="/products/acti-znr-222p">ACTi ZNR-222P</a></td>
    </tr>
  </tbody>
</table>

<h2>一帆安全整合的案例思維</h2>
<p>一帆安全整合在做辦公室監視規劃時，通常不是從品牌型錄開始，而是先看這個案場到底要解決什麼問題。若是櫃台爭議多，就先處理辨識角度；若是多樓層辦公，就先處理回放與管理；若是倉庫夜間事件多，就把低照度與保存天數放前面。</p>
<p>這也是為什麼同樣是監視器案例，有些看起來鏡頭比較少，卻反而更值得參考。因為真正好的案例，不是堆設備，而是把場域問題做對。</p>

<h2>案例比對時最常忽略的地方</h2>
<ul>
  <li><strong>只看鏡頭數量：</strong>忽略每支鏡頭的任務與角度。</li>
  <li><strong>只看白天完工照：</strong>沒看夜間畫面與回放需求。</li>
  <li><strong>沒看保存與主機：</strong>案子看起來完成，但實際回查體驗可能很差。</li>
  <li><strong>沒看維護：</strong>案例當下能用，不代表長期好管理。</li>
</ul>

<h2>延伸閱讀建議</h2>
<ul>
  <li><a href="/guides/office-cctv-system-guide">辦公室監視器怎麼選</a>：適合企業辦公場景。</li>
  <li><a href="/guides/cctv-installation-planning-guide">監視器安裝怎麼規劃</a>：適合回到整體規劃順序。</li>
  <li><a href="/guides/cctv-storage-and-nvr-planning-guide">監視器容量、焦距與 NVR 怎麼一起規劃</a>：適合把案例裡的配置邏輯看懂。</li>
</ul>

<h2>採購建議</h2>
<p>如果你正在比對辦公室監視器案例，建議不要只看照片，而是先列出自己案場的問題，再對照案例邏輯是否相近。若你希望直接把這些判斷轉成方案，可以透過 <a href="/quote-request">詢價頁</a> 讓一帆安全整合協助盤點。</p>
`,
    contentType: 'case-study',
    targetKeyword: '辦公室監視器案例',
    searchIntent: 'commercial',
    secondaryKeywords: ['監視器案例', '企業監視器案例', '商辦監視器案例', '監視系統案例', '台北辦公室監視器'],
    faq: [
      {
        question: '看監視器案例時最重要的是什麼？',
        answer: '最重要的是看原本問題、鏡頭任務、保存與主機配置，以及後續維護邏輯，而不是只看裝了幾支鏡頭。',
      },
      {
        question: '辦公室監視器案例能直接照抄嗎？',
        answer: '不建議直接照抄。比較好的做法是看案例背後的判斷方式，再對回自己的動線、光線、保存需求與施工限制。',
      },
      {
        question: '案例裡為什麼常提到 NVR 和硬碟？',
        answer: '因為企業場域真正常出問題的，不只是鏡頭，而是錄影保存、回放效率與後續擴充，這些都跟 NVR 和硬碟有關。',
      },
    ],
    relatedServiceSlugs: ['cctv', 'integration'],
    relatedProductSlugs: ['acti-z72', 'acti-z722', 'acti-z53', 'acti-znr-126', 'acti-znr-222p', 'acti-znr-423'],
    seoTitle: '辦公室監視器案例怎麼看？死角、保存與維護重點整理｜一帆安全整合',
    seoDescription:
      '整理辦公室監視器案例該怎麼看，不只看完工照片，還包括死角、錄影保存、NVR 配置與可維護架構的判斷重點。',
    sortOrder: 26,
  },
  {
    slug: 'cctv-faq-and-compliance-guide',
    title: '監視器常見問題與合規重點：錄影保存、調閱權限、辦公室安裝前先看這些',
    excerpt:
      '企業在裝監視器前，最常問的不只是鏡頭與價格，還有錄影能留多久、誰能調閱、辦公室安裝要注意什麼，以及怎麼避免後續管理混亂。這篇整理常見問題與合規重點。',
    coverImage: '/images/portfolio/weshaire-ai-face-recognition.webp',
    content: `
<p>企業在評估監視器時，真正常卡住的往往不是規格，而是錄影到底要留多久、畫面誰能看、哪些地方適合裝、哪些地方要更小心。這些問題如果前期沒講清楚，後面不只採購難決策，管理上也容易出現爭議。</p>
<p>這篇把企業監視器最常見的 FAQ 與管理重點整理在一起，讓你在正式安裝前，先把保存、調閱、施工與內部管理方式想清楚。</p>

<h2>監視器 FAQ 重點先看</h2>
<ul>
  <li><strong>保存天數沒有單一標準：</strong>要看管理需求、事件頻率與預算。</li>
  <li><strong>調閱權限要先定義：</strong>誰能看、誰能匯出、誰能管理，要前期講清楚。</li>
  <li><strong>安裝位置要考慮場景與界線：</strong>不是所有區域都用同樣思維處理。</li>
  <li><strong>正式規劃要把施工與管理一起看：</strong>不然很容易變成設備裝好了，流程卻沒接起來。</li>
</ul>

<h2>企業最常問的 6 個問題</h2>
<table>
  <thead>
    <tr>
      <th>問題</th>
      <th>核心判斷</th>
      <th>建議方向</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>錄影要留幾天？</td>
      <td>看事件回查需求與預算</td>
      <td>先用容量工具試算</td>
    </tr>
    <tr>
      <td>誰能調閱畫面？</td>
      <td>看管理分工與責任</td>
      <td>先定義角色與流程</td>
    </tr>
    <tr>
      <td>辦公室哪裡適合裝？</td>
      <td>看辨識、留證與動線需求</td>
      <td>先列出每區任務</td>
    </tr>
    <tr>
      <td>Wi-Fi 攝影機可不可以？</td>
      <td>看穩定性與集中管理需求</td>
      <td>企業多數仍以 NVR 架構較穩</td>
    </tr>
    <tr>
      <td>夜間看不清怎麼辦？</td>
      <td>看低照度、補光與焦距</td>
      <td>不要只加畫素</td>
    </tr>
    <tr>
      <td>未來想擴充怎麼做？</td>
      <td>看 NVR 通道與網路架構</td>
      <td>一開始就預留空間</td>
    </tr>
  </tbody>
</table>

<h2>一帆安全整合怎麼處理這類問題</h2>
<p>一帆安全整合在做監視規劃時，通常不會只回答鏡頭型號，而是把保存天數、調閱角色、施工限制與後續擴充一起整理。對企業來說，真正重要的是事情發生時能調得到畫面、看得清楚內容，也清楚誰負責管理。</p>

<h2>常見管理風險</h2>
<ul>
  <li><strong>錄影有留，但留不夠久：</strong>事件要查時已經被覆蓋。</li>
  <li><strong>有畫面，但沒分權限：</strong>誰都能看或誰都不能看，管理容易失焦。</li>
  <li><strong>有裝鏡頭，但任務不清：</strong>真正發生問題時還是沒有關鍵畫面。</li>
  <li><strong>系統可用，但難維護：</strong>一擴充就要重做。</li>
</ul>

<h2>延伸閱讀建議</h2>
<ul>
  <li><a href="/guides/cctv-installation-planning-guide">監視器安裝怎麼規劃</a></li>
  <li><a href="/guides/cctv-system-pricing-guide">監視器價格怎麼算</a></li>
  <li><a href="/guides/cctv-storage-and-nvr-planning-guide">監視器容量、焦距與 NVR 怎麼一起規劃</a></li>
  <li><a href="/guides/taipei-cctv-installation-company-guide">台北監視器安裝公司怎麼選</a></li>
</ul>

<h2>採購建議</h2>
<p>如果你正在討論監視器的內部需求，建議先把保存天數、調閱角色、鏡頭任務與施工限制列出來，再進入 <a href="/quote-request">正式詢價</a>。這樣比較容易比對方案，也更容易建立長期可管理的監視系統。</p>
`,
    contentType: 'faq',
    targetKeyword: '監視器常見問題',
    searchIntent: 'commercial',
    secondaryKeywords: ['監視器 FAQ', '監視器錄影保存', '監視器調閱權限', '辦公室監視器問題', '企業監視器管理'],
    faq: [
      {
        question: '監視器錄影要留幾天比較合理？',
        answer: '沒有固定答案，通常要看企業的事件回查需求、預算與管理流程，再搭配容量與硬碟方向一起評估。',
      },
      {
        question: '監視器畫面誰可以調閱？',
        answer: '建議前期就先定義角色與權限，包含誰可以看即時畫面、誰可以回放、誰可以匯出，避免後續管理爭議。',
      },
      {
        question: '辦公室所有地方都適合裝監視器嗎？',
        answer: '不建議用同一套思維處理所有區域，應先看各區域任務、管理需求與適當界線，再決定鏡頭位置與用途。',
      },
    ],
    relatedServiceSlugs: ['cctv', 'integration'],
    relatedProductSlugs: ['acti-z72', 'acti-z722', 'acti-z53', 'acti-znr-126', 'acti-znr-222p', 'acti-znr-423'],
    seoTitle: '監視器常見問題與合規重點：保存、調閱與安裝前必看｜一帆安全整合',
    seoDescription:
      '整理企業監視器最常見問題，包括錄影保存、調閱權限、辦公室安裝前注意事項，以及如何避免後續管理混亂。',
    sortOrder: 27,
  },
  {
    slug: 'retail-store-cctv-guide',
    title: '門市監視器怎麼規劃？收銀台、出入口、貨架與夜間留證重點',
    excerpt:
      '門市監視器和辦公室不一樣，除了出入口與櫃台，還要看收銀、貨架死角、營業中動線與打烊後留證。這篇整理門市監視器規劃與常見踩雷點。',
    coverImage: '/images/portfolio/weshaire-ai-face-recognition.webp',
    content: `
<p>門市監視器規劃的重點，和一般辦公室很不一樣。因為門市更在意收銀台爭議、來客出入口、貨架死角、營業中動線，以及打烊後是否仍能留到有用畫面。若只用一般辦公室思維處理，常常會出現白天看似正常、實際卻無法留證的情況。</p>
<p>所以，門市監視器不只是裝幾支，而是要把櫃台、入口、貨架、倉儲與夜間環境各自拆開來看。這樣做，後面不管是回查爭議、追查事件還是維護擴充都會更穩。</p>

<h2>門市監視器重點先看</h2>
<ul>
  <li><strong>收銀台：</strong>先看金流與爭議回查，不只看廣角畫面。</li>
  <li><strong>出入口：</strong>先看來客辨識與進出動線。</li>
  <li><strong>貨架區：</strong>先看死角與視線遮蔽。</li>
  <li><strong>打烊後：</strong>先看低照度、補光與保存策略。</li>
</ul>

<h2>門市常見區域怎麼規劃</h2>
<table>
  <thead>
    <tr>
      <th>區域</th>
      <th>主要任務</th>
      <th>規劃重點</th>
      <th>產品方向</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>出入口</td>
      <td>辨識來客與動線</td>
      <td>逆光、玻璃門、進出速度</td>
      <td><a href="/products/acti-z72">ACTi Z72</a></td>
    </tr>
    <tr>
      <td>收銀台</td>
      <td>爭議回查與操作留證</td>
      <td>角度、遮擋與臉部辨識</td>
      <td><a href="/products/acti-z722">ACTi Z722</a></td>
    </tr>
    <tr>
      <td>貨架 / 通道</td>
      <td>追查死角與流程</td>
      <td>視線遮蔽與走道銜接</td>
      <td><a href="/products/acti-z53">ACTi Z53</a></td>
    </tr>
    <tr>
      <td>中小型門市主機</td>
      <td>集中錄影與回放</td>
      <td>保存天數與擴充</td>
      <td><a href="/products/acti-znr-222p">ACTi ZNR-222P</a></td>
    </tr>
  </tbody>
</table>

<h2>門市最常踩的坑</h2>
<ul>
  <li><strong>只拍整體，不拍重點：</strong>收銀或出入口發生爭議時沒有有效畫面。</li>
  <li><strong>貨架死角沒補：</strong>事件在遮蔽區發生卻追不到。</li>
  <li><strong>只看營業中：</strong>忽略打烊後低照度與留證需求。</li>
  <li><strong>保存策略沒算：</strong>真正要查時錄影已覆蓋。</li>
</ul>

<h2>一帆安全整合怎麼看門市場景</h2>
<p>一帆安全整合在做門市監視規劃時，會先看收銀台、出入口與貨架死角，再回頭決定鏡頭與主機方向。因為對門市來說，真正會影響營運的通常是爭議畫面查不查得到，而不是型號多漂亮。</p>

<h2>延伸閱讀建議</h2>
<ul>
  <li><a href="/guides/cctv-installation-planning-guide">監視器安裝怎麼規劃</a></li>
  <li><a href="/guides/cctv-system-pricing-guide">監視器價格怎麼算</a></li>
  <li><a href="/guides/cctv-recommendation-guide">監視器推薦怎麼看</a></li>
  <li><a href="/guides/cctv-storage-and-nvr-planning-guide">監視器容量、焦距與 NVR 怎麼一起規劃</a></li>
</ul>

<h2>採購建議</h2>
<p>如果你的場景是門市、展示空間或零售通路，建議先把收銀、出入口、貨架死角與打烊後需求列出來，再進入 <a href="/quote-request">正式詢價</a>。這樣提出來的方案會比只看鏡頭數量更符合實際需求。</p>
`,
    contentType: 'guide',
    targetKeyword: '門市監視器',
    searchIntent: 'commercial',
    secondaryKeywords: ['店面監視器', '零售監視器', '收銀台監視器', '門市監視系統', '商店監視器安裝'],
    faq: [
      {
        question: '門市監視器和辦公室監視器差在哪裡？',
        answer: '門市更重視收銀爭議、來客出入口、貨架死角與打烊後留證，因此鏡頭任務與規劃順序通常和辦公室不同。',
      },
      {
        question: '門市一定要拍到收銀台嗎？',
        answer: '多數零售場景都建議優先處理收銀台畫面，因為這通常是最常需要回查與留證的區域。',
      },
      {
        question: '門市監視器夜間要注意什麼？',
        answer: '要特別看低照度、補光、店外光源差異與保存策略，不能只看白天營業中的畫面。',
      },
    ],
    relatedServiceSlugs: ['cctv', 'integration'],
    relatedProductSlugs: ['acti-z72', 'acti-z722', 'acti-z53', 'acti-znr-126', 'acti-znr-222p', 'acti-znr-423'],
    seoTitle: '門市監視器怎麼規劃？收銀台、出入口與夜間留證重點｜一帆安全整合',
    seoDescription:
      '整理門市監視器規劃重點，包括收銀台、出入口、貨架死角、夜間留證與保存策略，幫助零售場景更有效規劃。',
    sortOrder: 28,
  },
];

async function upsertGuide(guide: GuideSeed) {
  const existing = await prisma.guideArticle.findUnique({
    where: { slug: guide.slug },
    select: { id: true },
  });

  await prisma.guideArticle.upsert({
    where: { slug: guide.slug },
    update: {
      title: guide.title,
      excerpt: guide.excerpt,
      coverImage: guide.coverImage,
      content: guide.content,
      contentGroup: 'guide',
      contentType: guide.contentType,
      topic: '監視與安防',
      targetKeyword: guide.targetKeyword,
      searchIntent: guide.searchIntent,
      secondaryKeywords: guide.secondaryKeywords,
      faq: guide.faq,
      authorName: '一帆安全整合',
      reviewedAt,
      relatedServiceSlugs: guide.relatedServiceSlugs,
      relatedProductSlugs: guide.relatedProductSlugs,
      legacyPath: null,
      redirectStatus: 'none',
      targetGuideSlug: null,
      seoTitle: guide.seoTitle,
      seoDescription: guide.seoDescription,
      isPublished: true,
      publishedAt,
      sortOrder: guide.sortOrder,
      updatedBy: null,
    },
    create: {
      slug: guide.slug,
      title: guide.title,
      excerpt: guide.excerpt,
      coverImage: guide.coverImage,
      content: guide.content,
      contentGroup: 'guide',
      contentType: guide.contentType,
      topic: '監視與安防',
      targetKeyword: guide.targetKeyword,
      searchIntent: guide.searchIntent,
      secondaryKeywords: guide.secondaryKeywords,
      faq: guide.faq,
      authorName: '一帆安全整合',
      reviewedAt,
      relatedServiceSlugs: guide.relatedServiceSlugs,
      relatedProductSlugs: guide.relatedProductSlugs,
      legacyPath: null,
      redirectStatus: 'none',
      targetGuideSlug: null,
      seoTitle: guide.seoTitle,
      seoDescription: guide.seoDescription,
      isPublished: true,
      publishedAt,
      sortOrder: guide.sortOrder,
      updatedBy: null,
    },
  });

  console.log(existing ? `Updated guide: ${guide.slug}` : `Created guide: ${guide.slug}`);
}

async function main() {
  for (const guide of guides) {
    await upsertGuide(guide);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
