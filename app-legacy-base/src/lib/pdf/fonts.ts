import fs from 'fs';
import path from 'path';

/**
 * Generate @font-face CSS for PDF generation using LOCAL fonts.
 * - Inter: loaded from public/fonts/ as base64 data URIs
 * - Noto Sans TC / Noto Serif TC: reference system fonts (installed via apk in Docker)
 * 
 * This eliminates the Google Fonts CDN dependency that caused
 * Puppeteer timeout errors on M4.
 */
export function getPdfFontFaceCss(): string {
    const fontsDir = path.join(process.cwd(), 'public', 'fonts');

    // Load Inter fonts as base64 (small files, ~300KB each)
    const interWeights = [400, 500, 600, 700, 800];
    const interFontFaces = interWeights.map(weight => {
        const fontFile = path.join(fontsDir, `Inter-${weight}.ttf`);
        if (fs.existsSync(fontFile)) {
            const base64 = fs.readFileSync(fontFile).toString('base64');
            return `@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: ${weight};
  font-display: swap;
  src: url(data:font/truetype;base64,${base64}) format('truetype');
}`;
        }
        // Fallback: use system sans-serif
        return '';
    }).filter(Boolean);

    // Noto Sans TC and Noto Serif TC: use system fonts (installed in Docker via fonts-noto-cjk)
    // Use url(file:///) for reliable loading — local() name matching is unreliable across systems.
    // The .ttc (TrueType Collection) files contain all CJK variants; Chromium auto-selects TC glyphs.
    const notoSansRegular = 'file:///usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc';
    const notoSansBold = 'file:///usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc';
    const notoSerifRegular = 'file:///usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc';
    const notoSerifBold = 'file:///usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc';

    const notoCjkFontFaces = `
@font-face {
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: local('Noto Sans CJK TC'), local('Noto Sans CJK TC Regular'), url('${notoSansRegular}');
}
@font-face {
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: local('Noto Sans CJK TC Medium'), url('${notoSansRegular}');
}
@font-face {
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: local('Noto Sans CJK TC Bold'), url('${notoSansBold}');
}
@font-face {
  font-family: 'Noto Sans TC';
  font-style: normal;
  font-weight: 900;
  font-display: swap;
  src: local('Noto Sans CJK TC Black'), url('${notoSansBold}');
}
@font-face {
  font-family: 'Noto Serif TC';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: local('Noto Serif CJK TC SemiBold'), url('${notoSerifRegular}');
}
@font-face {
  font-family: 'Noto Serif TC';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: local('Noto Serif CJK TC Bold'), url('${notoSerifBold}');
}
@font-face {
  font-family: 'Noto Serif TC';
  font-style: normal;
  font-weight: 900;
  font-display: swap;
  src: local('Noto Serif CJK TC Black'), url('${notoSerifBold}');
}`;

    return [...interFontFaces, notoCjkFontFaces].join('\n');
}
