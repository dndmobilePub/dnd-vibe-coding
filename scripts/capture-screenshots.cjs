const { chromium } = require('@playwright/test');
const { spawn } = require('node:child_process');
const path = require('node:path');

(async () => {
  const port = 3102;
  const server = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '--port', String(port)], { windowsHide: true, stdio: 'ignore' });
  let browser;
  try {
    const url = `http://127.0.0.1:${port}`;
    for (let attempt = 0; ; attempt++) {
      try { if ((await fetch(url)).ok) break; } catch {}
      if (attempt > 100) throw new Error('Preview server did not start');
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
    const page = await browser.newPage();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    async function ready() {
      await page.locator('.app-shell[aria-busy="false"]').waitFor();
      await page.evaluate(() => document.fonts.ready);
    }
    async function capture(name) {
      await ready();
      await page.screenshot({ path: path.join('docs/screenshots', name + '.png'), fullPage: true, animations: 'disabled' });
      console.log(name);
    }
    for (const [width, height] of [[1440,1000],[375,812],[768,1024],[812,375]]) {
      await page.setViewportSize({ width, height }); await page.goto(url);
      await capture(`ui-review-home-${width}`);
      if (width === 1440) await capture('home-desktop');
      if (width === 375) await capture('home-mobile');
    }
    await page.setViewportSize({ width:1440, height:1000 });
    await page.goto(url+'/data-library'); await capture('data-library');
    await page.getByRole('button', { name:'새 분석 만들기' }).click();
    await page.getByRole('textbox', { name:/분석 이름/ }).fill('제품별 생산 실적 분석');
    await capture('analysis-setup');
    await page.getByRole('button', { name:'다음: 데이터 준비', exact:true }).click();
    await page.getByRole('button', { name:'추천 적용', exact:true }).click();
    await capture('data-preparation');
    await capture('data-checkboxes');
    await page.setViewportSize({ width:390, height:844 }); await capture('data-preparation-mobile');
    await page.setViewportSize({ width:1440, height:1000 });
    await page.getByRole('button', { name:'다음: 데이터 조회', exact:true }).click();
    await page.getByRole('button', { name:'다음: 데이터 연결', exact:true }).click(); await capture('data-join');
    await page.getByRole('button', { name:'다음: 데이터 전처리', exact:true }).click();
    await page.getByRole('checkbox', { name:'결측값 포함 행 제외' }).check();
    await page.getByRole('checkbox', { name:'중복 행 제거' }).check();
    await page.getByRole('checkbox', { name:'달성률 계산열 추가' }).check();
    await page.getByRole('button', { name:'다음: 결과 보기', exact:true }).click(); await capture('data-result');
    await page.getByRole('button', { name:'데이터 검증', exact:true }).click();
    await page.getByRole('button', { name:'다음: 데이터셋 저장', exact:true }).click();
    await page.getByRole('textbox', { name:'데이터셋 이름' }).fill('생산 실적 준비 결과');
    await page.locator('.save-dataset-actions').getByRole('button', { name:'데이터셋 저장', exact:true }).click();
    await page.getByRole('button', { name:'다음: 차트 · 시각화', exact:true }).click();
    await page.getByLabel('X축', { exact:true }).selectOption('product_code');
    await page.getByLabel('Y축', { exact:true }).selectOption('quantity'); await capture('analysis-chart');
    await page.getByRole('button', { name:'다음: 인사이트', exact:true }).click(); await capture('analysis-insights');
    await page.getByRole('button', { name:'다음: 게시 · 공유', exact:true }).click(); await capture('analysis-publish');
    await page.getByRole('button', { name:'분석 게시하기', exact:true }).click();
    await page.locator('.toast').waitFor({ state:'hidden' }).catch(()=>{});
    await capture('analyses-desktop');
  } finally { if (browser) await browser.close(); server.kill(); }
})().catch(error => { console.error(error); process.exitCode=1; });
