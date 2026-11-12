// Local navigation regression: node tests/test_nav.mjs http://localhost:8892/ <shots-dir>
import assert from 'node:assert/strict';
import { mkdir, readdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';
const base = process.argv[2] || 'http://localhost:8892/';
const out = process.argv[3] || '/tmp/claude-501/codex_tasks/shots';
assert.equal(new URL(base).port, '8892');
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.route('https://boardgame.leisurecat.cloud/**', r => r.fulfill({ json: { ok: true }, headers: { 'access-control-allow-origin': '*' } }));
  const check = async label => {
    await page.locator('.nav-back:not(.rate-nav)').waitFor({ state: 'visible' });
    const issues = await page.locator('.nav-back:not(.rate-nav)').evaluate(el => {
      const r = el.getBoundingClientRect(), issues = [];
      if (r.height < 36 || r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight) issues.push('size or visibility');
      if (document.documentElement.scrollWidth > innerWidth) issues.push('horizontal overflow');
      for (const other of document.querySelectorAll('a,button,input,textarea,select,summary,[role="button"],h1,.ttl,.conn')) {
        if (other === el || other.contains(el)) continue;
        const b = other.getBoundingClientRect();
        if (b.width && b.height && r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top) issues.push(other.outerHTML.slice(0, 100));
      }
      if (el.closest('#shot') && !el.hasAttribute('data-html2canvas-ignore')) issues.push('included in screenshot');
      return issues;
    });
    assert.deepEqual(issues, [], label);
    console.log('PASS', label);
  };
  await page.goto(base);
  assert.equal(await page.locator('.nav-back:not(.rate-nav)').textContent(), '‹ 全部游戏');
  assert.equal(await page.locator('.nav-back:not(.rate-nav)').getAttribute('href'), 'https://boardgame.leisurecat.cloud');
  await check('landing navigation');
  await page.screenshot({ path: `${out}/nav_bham_landing.png` });
  await page.click('[data-act="create"]');
  await page.waitForSelector('[data-name="0"]');
  const code = new URL(page.url()).searchParams.get('r');
  await page.fill('[data-name="0"]', '导航测试');
  await page.waitForTimeout(500);
  await check('setup navigation');
  const leaveAndRejoin = async () => {
    assert.equal(await page.locator('.nav-back:not(.rate-nav)').textContent(), '‹ 首页');
    await page.click('.nav-back:not(.rate-nav)');
    await page.waitForSelector('[data-act="create"]');
    assert.equal(new URL(page.url()).search, '');
    await page.click(`[data-act="rejoin"][data-code="${code}"]`);
  };
  await leaveAndRejoin();
  await page.waitForSelector('[data-name="0"]');
  assert.equal(await page.inputValue('[data-name="0"]'), '导航测试');
  console.log('PASS setup retained after leaving');
  await page.click('[data-act="start"]');
  await page.waitForSelector('.status');
  const status = await page.textContent('.status');
  for (const tab of ['order', 'score', 'mvp']) {
    await page.click(`[data-tab="${tab}"]`);
    await check(`${tab} navigation`);
    if (tab === 'order') await page.screenshot({ path: `${out}/nav_bham_room.png` });
    await leaveAndRejoin();
    await page.waitForSelector('.status');
    assert.equal(await page.textContent('.status'), status);
    assert.ok((await page.locator('#app').textContent()).includes('导航测试'));
    console.log('PASS room state retained:', tab);
  }
  for (const name of (await readdir(new URL('../public/', import.meta.url))).filter(n => n.endsWith('.html') && n !== 'index.html')) {
    await page.goto(new URL(name, base).href);
    assert.equal(await page.locator('.nav-back:not(.rate-nav)').textContent(), '‹ 返回');
    assert.equal(await page.locator('.nav-back:not(.rate-nav)').getAttribute('href'), '/');
    await check(`${name} navigation`);
    if (name === 'guide.html') await page.screenshot({ path: `${out}/nav_bham_guide.png` });
    await page.click('.nav-back:not(.rate-nav)');
    await page.waitForSelector('[data-act="create"]');
  }
  console.log('ALL PASS');
} finally { await browser.close(); }
