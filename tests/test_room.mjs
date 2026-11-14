// Two phones in one room. Usage: node test_room.mjs <baseUrl> <outDir>
import { chromium } from 'playwright-core';
const [,, BASE, OUT] = process.argv;
const b = await chromium.launch({ channel: 'chrome' });
const mk = async () => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage(); p.errs = [];
  p.on('pageerror', e => p.errs.push(String(e))); p.on('console', m => m.type() === 'error' && p.errs.push(m.text()));
  return p;
};
const A = await mk(), B = await mk();
let fails = 0;
const eq = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', name, ok ? '' : `got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); };
const wait = ms => new Promise(r => setTimeout(r, ms));
const shot = (p, n, full = false) => p.screenshot({ path: `${OUT}/${n}.png`, fullPage: full });
const trackOrder = p => p.$$eval('.slot', s => s.map(x => x.dataset.k.replace('slot-', '')));
const statusText = p => p.textContent('.status .t');

await A.goto(BASE); await wait(600); await shot(A, '00_landing');
await A.click('[data-act="create"]');
await A.waitForURL(/\?r=[A-Z0-9]{4}/);
const url = A.url(); console.log('room', url);
await B.goto(url); await B.waitForSelector('.chip');

// setup sync
await A.click('[data-act="n"][data-n="3"]'); await wait(300);
eq('B sees 3 players', await B.$$eval('[data-k^="seat-"]', r => r.length), 3);
await A.fill('[data-name="0"]', '小明'); await wait(700);
eq('B sees name', await B.inputValue('[data-name="0"]'), '小明');
await B.fill('[data-name="1"]', '阿花'); await B.fill('[data-name="2"]', '老王'); await B.press('[data-name="2"]', 'Enter'); await wait(500);
eq('A sees Tinsley (white) on seat 2', await A.getAttribute('[data-fig="1"] img', 'src'), 'img/tinsley.jpg');
eq('A keeps own name', await A.inputValue('[data-name="0"]'), '小明');
await shot(A, '01_setup');
await B.click('[data-act="start"]'); await A.waitForSelector('.status');
eq('A status', await statusText(A), '运河时代 · 第1/ 9 轮');
eq('first round: one action', (await A.textContent('.status .s')).includes('1 个行动'), true);
await shot(A, '02_round1');

// play 18 rounds (3 players: 9 per era); phones alternate who types and who settles
const ids = ['yellow', 'white', 'red'];
let order = await trackOrder(A);
eq('initial order', order, ids);
const spendsFor = r => ({ yellow: (r * 7) % 11, white: (r * 5) % 11, red: (r * 3) % 4 === 0 ? (r * 7) % 11 : (r * 2) % 9 });
for (let r = 1; r <= 18; r++) {
  const sp = spendsFor(r);
  const typer = r % 2 ? A : B, other = r % 2 ? B : A;
  // spends stay on the settling phone until it settles
  await other.fill('[data-spent="yellow"]', String(sp.yellow));
  await other.fill('[data-spent="white"]', String(sp.white));
  await other.fill('[data-spent="red"]', String(sp.red));
  if (r === 5) for (const id of ids) await typer.fill(`[data-spent="${id}"]`, String(sp[id]));
  await wait(450);
  const prevIndex = Object.fromEntries(order.map((id, i) => [id, i]));
  const expect = order.slice().sort((x, y) => sp[x] - sp[y] || prevIndex[x] - prevIndex[y]);
  if (r === 5) {  // both tap at the same moment; a tap on a greyed-out button does nothing
    const tap = p => p.evaluate(() => document.querySelector('[data-act="settle"]')?.click());
    await Promise.all([tap(A), tap(B)]); await wait(150); await Promise.all([tap(A), tap(B)]);
  }
  else await other.click('[data-act="settle"]');
  await wait(450);
  if (r === 3) { await shot(A, '02b_locked'); eq('settle locked on A right after', (await A.textContent('.btn[disabled]')).includes('刚刚已结算'), true); }
  await wait(2300);
  if (r === 8) eq('last canal round hint', (await A.textContent('.status .s')).includes('时代计分'), true);
  if (r === 9) { await shot(A, '03_era_change'); eq('era 2 starts', await statusText(B), '铁路时代 · 第1/ 9 轮'); eq('banner on A', (await A.textContent('.banner')).includes('运河时代已结束'), true); }
  if (r === 17) eq('last round: no income', (await A.textContent('.status .s')).includes('不收收入'), true);
  if (r === 18) break;
  const gotA = await trackOrder(A), gotB = await trackOrder(B);
  eq(`round ${r} order A`, gotA, expect); eq(`round ${r} same on B`, gotB, expect);
  order = gotA;
  if (r === 5) eq('double settle counted once', await statusText(A), '运河时代 · 第6/ 9 轮');
}
eq('game over on B', await statusText(B), '游戏结束');
await shot(B, '04_over');

// scoring: A does era 1, B does era 2 (keypad)
const keyIn = async (p, era, id, key, seq) => {
  await p.click(`[data-act="cell"][data-era="${era}"][data-id="${id}"][data-key="${key}"]`);
  for (const k of seq) await p.click(`[data-act="k"][data-k="${k}"]`);
  await wait(250);
};
await A.click('[data-act="tab"][data-tab="score"]'); await A.click('[data-act="era"][data-era="1"]');
await B.click('[data-act="tab"][data-tab="score"]');
await keyIn(A, 1, 'yellow', 'pre', ['1', '2', 'ok']);
await keyIn(A, 1, 'yellow', 'link', ['3', '+', '4', '+', '2', 'ok']);
await keyIn(A, 1, 'yellow', 'ind', ['5', '+', '8', 'ok']);
await keyIn(A, 1, 'white', 'pre', ['2', '0', 'ok']);
await keyIn(A, 1, 'white', 'ind', ['1', '0', '+', '7', 'ok']);
await keyIn(A, 1, 'red', 'pre', ['8', 'ok']);
await keyIn(A, 1, 'red', 'link', ['6', '+', '6', '+', '5', 'ok']);
eq('era 1 rows', await A.$$eval('.sc tbody th', t => t.map(x => x.textContent)), ['计分条', '运河', '产业', '合计']);
await A.click('[data-act="cell"][data-era="1"][data-id="yellow"][data-key="link"]'); await wait(200); await shot(A, '05_keypad'); await A.click('[data-act="k"][data-k="ok"]');
const tot1 = await A.$$eval('td.tt', t => t.map(x => x.textContent));
eq('era1 totals (order yellow? by current order)', tot1.length, 3);
await shot(A, '06_score_era1');
// era 2 on B: pre must be era1 total + mid (B opened the tab on era 1, which stays put while A scores it)
await B.click('[data-act="era"][data-era="2"]');
await keyIn(B, 2, 'yellow', 'pre', ['4', '9', 'ok']);   // era1 yellow = 12+9+13 = 34 → mid 15
await keyIn(B, 2, 'yellow', 'link', ['8', '+', '9', 'ok']);
await keyIn(B, 2, 'yellow', 'ind', ['1', '2', 'ok']);
await keyIn(B, 2, 'white', 'pre', ['5', '0', 'ok']);     // era1 white = 37 → mid 13
await keyIn(B, 2, 'white', 'ind', ['2', '0', '+', '1', '5', 'ok']);
await keyIn(B, 2, 'red', 'pre', ['4', '0', 'ok']);   // era1 red = 8+17 = 25 → mid 15
await keyIn(B, 2, 'red', 'link', ['9', '+', '9', '+', '9', '+', '8', 'ok']);
eq('era 2 rows', await B.$$eval('.sc tbody th', t => t.map(x => x.textContent)), ['计分条', '铁路', '产业', '合计']);
await wait(400);
const rowTotals = async p => Object.fromEntries(await p.$$eval('td.tt', ts => ts.map(t => [t.dataset.tt, t.textContent])));
await A.click('[data-act="era"][data-era="2"]'); await wait(200);
eq('era2 totals on A', await rowTotals(A), await rowTotals(B));
{ const t = await rowTotals(B); eq('era2 totals values', [t.yellow, t.white, t.red], ['78', '85', '75']); }
await shot(B, '07_score_era2');

await B.click('[data-act="tab"][data-tab="mvp"]'); await A.click('[data-act="tab"][data-tab="mvp"]'); await wait(400);
eq('MVP is 阿花 (white)', (await B.textContent('.mvp .nm')).trim(), '阿花');
const ranks = await B.$$eval('.rk .row', rs => rs.map(r => r.querySelector('.tot').textContent));
eq('ranking totals', ranks, ['85', '78', '75']);
const achs = await B.$$eval('.ach .an', a => a.map(x => x.textContent));
console.log('achievements', achs.join(' / '));
eq('has canal and rail kings', [achs.includes('运河之王'), achs.includes('铁路之王')], [true, true]);
const parts = await B.$$eval('.rk .row', rs => rs.map(r => r.querySelector('.parts').textContent.replace(/\s+/g, ' ').trim()));
eq('breakdown of the winner', parts[0], '行动分 33 运河 0 铁路 0 产业 52');
await shot(B, '08_mvp', true);
await shot(B, '08_mvp_fold');

// reconnect keeps state
await A.reload(); await A.waitForSelector('.status'); await wait(300);
eq('A after reload still over', await statusText(A), '游戏结束');
eq('A after reload mvp', (await A.textContent('.mvp .nm')).trim(), '阿花');

console.log(fails ? `${fails} FAILED` : 'ALL PASS', [...A.errs, ...B.errs].length ? '\nERRORS:\n' + [...A.errs, ...B.errs].join('\n') : '');
await b.close();
