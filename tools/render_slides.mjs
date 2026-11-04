// Renders the tutorial pictures public/guide/01.jpg … (800×400, one per "## " section of 讲解稿.md, same order).
// Everything is drawn here (HTML + inline SVG icons); no publisher art. Needs Chrome and playwright-core.
// Usage: node tools/render_slides.mjs [only-number]
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
const only = process.argv[2] ? Number(process.argv[2]) : null;

/* ---------- icons (viewBox 0 0 48 48) ---------- */
const C = { coal: '#2b2522', iron: '#d27a2c', brick: '#a8432a', brass: '#c99a45', parch: '#efe4cb', ink: '#2d241b', teal: '#4f8e9b', cream: '#f3ead6' };
const svg = (body, s = 48) => `<svg viewBox="0 0 48 48" width="${s}" height="${s}" aria-hidden="true">${body}</svg>`;
const cube = (top, l, r) => `<path d="M24 6 42 15 24 24 6 15z" fill="${top}"/><path d="M6 15 24 24v18L6 33z" fill="${l}"/><path d="M42 15 24 24v18l18-9z" fill="${r}"/>`;
const I = {
  coal: s => svg(cube('#7a716b', '#3d3632', '#57504b'), s),
  iron: s => svg(cube('#f0a25a', '#b5601f', '#d27a2c'), s),
  beer: s => svg(`<ellipse cx="24" cy="10" rx="13" ry="4.5" fill="#7a4f2a"/><path d="M11 10c-2 9-2 19 0 28 3 3 23 3 26 0 2-9 2-19 0-28-3 3-23 3-26 0z" fill="#a8693a"/><path d="M10.4 17c4 2 23 2 27.2 0M10.4 31c4 2 23 2 27.2 0" stroke="#4a3017" stroke-width="2.4" fill="none"/><path d="M18 13c-1 8-1 18 0 27M30 13c1 8 1 18 0 27" stroke="#7a4f2a" stroke-width="1.2" fill="none"/>`, s),
  cotton: s => svg(`<rect x="13" y="6" width="22" height="5" rx="2" fill="#8a6a3c"/><rect x="13" y="37" width="22" height="5" rx="2" fill="#8a6a3c"/><path d="M15 11h18c2 6 2 20 0 26H15c-2-6-2-20 0-26z" fill="#f4efe4"/><path d="M15 16h18M14.4 21h19.2M14.2 26h19.6M14.4 31h19.2" stroke="#cfc4ad" stroke-width="1.6"/>`, s),
  man: s => svg(`<path d="M6 16 24 8l18 8v20l-18 8-18-8z" fill="#c7964f"/><path d="M6 16l18 8 18-8M24 24v20" stroke="#7a5526" stroke-width="2" fill="none"/><path d="M10 24l10 4.5M10 30l10 4.5M28 28.5 38 24M28 34.5 38 30" stroke="#9c6f34" stroke-width="1.6"/>`, s),
  pottery: s => svg(`<path d="M17 6h14v5c7 4 9 11 9 18 0 8-6 13-16 13S8 37 8 29c0-7 2-14 9-18z" fill="#c9673f"/><path d="M17 6h14" stroke="#7d3a1f" stroke-width="3"/><path d="M9 27c8 3 22 3 30 0" stroke="#efe4cb" stroke-width="2.4" fill="none"/>`, s),
  brewery: s => I.beer(s),
  mine: s => svg(`<path d="M8 22h32l-4 14H12z" fill="#8a6a50"/><circle cx="16" cy="39" r="4" fill="#c99a45"/><circle cx="32" cy="39" r="4" fill="#c99a45"/><circle cx="17" cy="18" r="6" fill="#57504b" stroke="#8a7f78"/><circle cx="26" cy="15" r="7" fill="#6b625c" stroke="#8a7f78"/><circle cx="33" cy="19" r="5" fill="#57504b" stroke="#8a7f78"/>`, s),
  works: s => svg(`<rect x="28" y="4" width="7" height="18" fill="#5a4a40"/><path d="M6 44V22l10-6v6l10-6v6l10-6v28z" fill="#6e4a3a"/><rect x="11" y="30" width="7" height="8" fill="#f0a25a"/><rect x="23" y="30" width="7" height="8" fill="#f0a25a"/>`, s),
  canal: s => svg(`<path d="M2 34c6 3 10 3 16 0s10-3 16 0 10 3 12 1" stroke="#4f8e9b" stroke-width="3" fill="none"/><path d="M6 24h36l-4 8H10z" fill="#7a2a19"/><rect x="12" y="17" width="20" height="7" fill="#c99a45"/><rect x="34" y="14" width="3" height="10" fill="#2b2522"/>`, s),
  rail: s => svg(`<rect x="6" y="18" width="26" height="14" rx="2" fill="#3d3632"/><rect x="30" y="12" width="12" height="20" rx="1.5" fill="#57504b"/><rect x="33" y="15" width="6" height="6" fill="#f0c76a"/><rect x="10" y="10" width="5" height="8" fill="#2b2522"/><circle cx="13" cy="36" r="5" fill="#c99a45"/><circle cx="27" cy="36" r="5" fill="#c99a45"/><circle cx="38" cy="36" r="4" fill="#c99a45"/><path d="M2 43h44" stroke="#5a4a40" stroke-width="2"/>`, s),
  coin: s => svg(`<circle cx="24" cy="24" r="19" fill="#c99a45"/><circle cx="24" cy="24" r="15" fill="none" stroke="#8a6526" stroke-width="2"/><text x="24" y="31.5" text-anchor="middle" font-family="Georgia,serif" font-size="21" font-weight="700" fill="#4b3714">£</text>`, s),
  vp: s => svg(`<path d="M24 4l5.6 11.4L42 17.2l-9 8.8 2.1 12.4L24 32.6l-11.1 5.8L15 26l-9-8.8 12.4-1.8z" fill="#c99a45" stroke="#6e5220" stroke-width="2"/>`, s),
  card: s => svg(`<rect x="10" y="5" width="28" height="38" rx="3.5" fill="#2e3b52" stroke="#c99a45" stroke-width="2"/><circle cx="24" cy="24" r="8" fill="none" stroke="#c99a45" stroke-width="2"/><path d="M24 16v16M16 24h16" stroke="#c99a45" stroke-width="1.4"/>`, s),
  merchant: s => svg(`<path d="M6 18 10 8h28l4 10z" fill="#a8432a"/><path d="M6 18h36v3c-3 3-6 3-9 0-3 3-6 3-9 0-3 3-6 3-9 0-3 3-6 3-9 0z" fill="#efe4cb"/><rect x="9" y="22" width="30" height="20" fill="#7a5a3a"/><rect x="14" y="27" width="9" height="15" fill="#3a2b23"/><rect x="27" y="27" width="8" height="7" fill="#f0c76a"/>`, s),
  link: s => svg(`<path d="M24 5l16.5 9.5v19L24 43 7.5 33.5v-19z" fill="#2b2522" stroke="#c99a45" stroke-width="2.4"/><path d="M15 27a5 5 0 0 1 0-7l3-3a5 5 0 0 1 7 0M33 21a5 5 0 0 1 0 7l-3 3a5 5 0 0 1-7 0M19 29l10-10" stroke="#efe4cb" stroke-width="2.6" fill="none" stroke-linecap="round"/>`, s),
  bulb: s => svg(`<path d="M24 5a13 13 0 0 0-8 23c2 2 3 4 3 6h10c0-2 1-4 3-6A13 13 0 0 0 24 5z" fill="#f0c76a"/><rect x="18" y="35" width="12" height="4" rx="1" fill="#8a7a6a"/><rect x="19" y="40" width="10" height="3" rx="1" fill="#8a7a6a"/>`, s),
  loan: s => svg(`<rect x="6" y="12" width="36" height="24" rx="3" fill="#d9c79a" stroke="#6e5220" stroke-width="2"/><circle cx="24" cy="24" r="7" fill="#c99a45"/><text x="24" y="28" text-anchor="middle" font-family="Georgia,serif" font-size="10" font-weight="700" fill="#4b3714">30</text>`, s),
  develop: s => svg(`<rect x="10" y="8" width="28" height="32" rx="3" fill="#8e6bb8" stroke="#3a2b23" stroke-width="2"/><path d="M14 12l20 24M34 12 14 36" stroke="#f3ead6" stroke-width="4" stroke-linecap="round"/>`, s),
  scout: s => svg(`<circle cx="20" cy="20" r="11" fill="none" stroke="#c99a45" stroke-width="4"/><path d="M28 28l12 12" stroke="#c99a45" stroke-width="6" stroke-linecap="round"/><circle cx="20" cy="20" r="7" fill="#4f8e9b" opacity=".5"/>`, s),
  pass: s => svg(`<circle cx="24" cy="24" r="17" fill="none" stroke="#bfae98" stroke-width="3"/><path d="M15 24h18M27 18l6 6-6 6" stroke="#bfae98" stroke-width="3" fill="none" stroke-linecap="round"/>`, s),
  income: s => svg(`<circle cx="20" cy="26" r="15" fill="#c99a45"/><text x="20" y="32" text-anchor="middle" font-family="Georgia,serif" font-size="16" font-weight="700" fill="#4b3714">£</text><path d="M37 30V8M31 14l6-6 6 6" stroke="#6b8f5a" stroke-width="4" fill="none" stroke-linecap="round"/>`, s),
  build: s => svg(`<path d="M8 40V20l16-12 16 12v20z" fill="#a8432a"/><path d="M8 20l16-12 16 12" stroke="#3a2b23" stroke-width="3" fill="none"/><rect x="19" y="27" width="10" height="13" fill="#3a2b23"/><path d="M12 25h6M30 25h6M12 31h4M32 31h4" stroke="#e8b89a" stroke-width="2"/>`, s),
  sell: s => svg(`<path d="M6 30h22l6-8h8v14H6z" fill="#5a443a"/><circle cx="14" cy="38" r="4" fill="#2b2522"/><circle cx="34" cy="38" r="4" fill="#2b2522"/><path d="M9 30V18h16v12" fill="#c7964f"/><path d="M9 18l8-6 8 6" fill="#9c6f34"/>`, s),
  network: s => svg(`<circle cx="10" cy="34" r="6" fill="#efe4cb" stroke="#3a2b23" stroke-width="2"/><circle cx="38" cy="14" r="6" fill="#efe4cb" stroke="#3a2b23" stroke-width="2"/><path d="M15 31 33 17" stroke="#c99a45" stroke-width="5" stroke-linecap="round"/><path d="M15 31 33 17" stroke="#3a2b23" stroke-width="1.5" stroke-dasharray="3 3"/>`, s)
};
const ic = (k, s = 40) => `<span class="ic">${I[k](s)}</span>`;

/* ---------- building blocks ---------- */
const box = (h, body, cls = '') => `<div class="box ${cls}"><div class="bh">${h}</div><div class="bb">${body}</div></div>`;
const chip = (icon, label, sub = '') => `<div class="chip">${ic(icon, 46)}<b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;
const flow = steps => `<div class="flow">${steps.map((s, i) => `${i ? '<i class="arr">›</i>' : ''}<div class="step">${s.icon ? ic(s.icon, 42) : ''}<b>${s.t}</b>${s.s ? `<small>${s.s}</small>` : ''}</div>`).join('')}</div>`;
const table = (head, rows) => `<table class="tb"><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;
const num = (n, label) => `<div class="num"><b>${n}</b><span>${label}</span></div>`;
const steps = list => `<ol class="ol">${list.map(x => `<li>${x}</li>`).join('')}</ol>`;
const pc = c => `<span class="pc" style="background:${c}"></span>`;

/* ---------- the slides (one per section, same order as 讲解稿.md) ---------- */
const S = [
  { tag: '开篇', full: true, left: `<div class="cover"><div class="cv-en">BRASS · BIRMINGHAM</div><div class="cv-t">两个时代 · 一百年工业</div>
      <div class="cv-row">${chip('canal', '运河时代', '1770–1830')}${chip('rail', '铁路时代', '1830–1870')}</div></div>`,
    right: box('怎么赢', '每个时代结束：<br><b>连线</b> + <b>已翻面产业</b> 计分<br>铁路时代后分数最高者胜') },
  { tag: '准备', left: table(['人数', '不放商人', '牌堆去掉的地点卡'], [['4 人', '—', '—'], ['3 人', '诺丁汉', '青色'], ['2 人', '沃灵顿、诺丁汉', '蓝色、青色']]) + '<p class="cap">去掉的地点照样可以建造</p>',
    right: box('市场', `${ic('coal', 26)} 煤：放满，空 <b>1</b> 个 £1 格<br>${ic('iron', 26)} 铁：放满，空 <b>2</b> 个 £1 格`) + box('商人', `${ic('beer', 26)} 每个有商人的啤酒格放 <b>1</b> 桶`) },
  { tag: '准备', left: `<div class="grid4">${num('£17', '起始资金')}${num('0', '分数标记')}${num('第10格', '收入标记 = 收入 0')}${num('8+1', '8 张手牌 + 1 张背面弃牌')}</div>`,
    right: box('顺位', '洗乱角色板块<br>随机排上顺位轨<br>= 第一轮行动顺序') },
  { tag: '流程', left: `<div class="grid3">${num('8', '4 人局 · 每时代')}${num('9', '3 人局 · 每时代')}${num('10', '2 人局 · 每时代')}</div><p class="cap">轮数固定：牌堆和手牌打完，时代结束</p>`,
    right: box('行动数', `每轮每人 <b>2</b> 个行动<br>运河时代<b>第 1 轮</b>只 <b>1</b> 个`) + box('出牌', `每个行动弃 ${ic('card', 24)} 1 张<br>做完补到 8 张`) },
  { tag: '流程', left: `<div class="ord"><div class="ordc"><em>本轮花费</em>${[['A', 12], ['B', 5], ['C', 5], ['D', 20]].map(([p, m]) => `<div class="pl"><span>${p}</span><b>£${m}</b></div>`).join('')}</div><i class="arr big">›</i>
      <div class="ordc"><em>下一轮</em>${[['B', 5], ['C', 5], ['A', 12], ['D', 20]].map(([p, m], i) => `<div class="pl"><i>${i + 1}</i><span>${p}</span><b>£${m}</b></div>`).join('')}</div></div><p class="cap">B、C 同为 £5：保持原来 B 在 C 前</p>`,
    right: box('规则', '花得<b>最少</b>先手<br>花得最多最后<br><b>同额保持原相对顺序</b>') + box('钱放哪', '花的钱先放在<br>自己的角色板块上') },
  { tag: '流程', left: `<div class="inc">${[1, 1, 2, 2, 3, 3, 4, 4, 5, 5].map((g, i) => `<span class="g${g % 2}${i === 5 ? ' on' : ''}"></span>`).join('')}</div><p class="cap">同色相邻的几格是同一个收入<b>等级</b>：一格 ≠ 一级</p>
      <div class="two" style="margin-top:14px">${chip('income', '翻面 / 牛津奖励', '按<b>格</b>前进')}${chip('loan', '贷款', '按<b>等级</b>后退 3 级')}</div>`,
    right: box('最后一轮', '铁路时代最后一轮<br><b>不收收入</b>') + box('付不起', '拆自己产业，按费用一半换钱<br>还不够：每差 £1 扣 1 分') },
  { tag: '行动', left: `<div class="grid3 acts">${chip('build', '建造', '需特定的牌')}${chip('network', '网络')}${chip('develop', '发展')}${chip('sell', '出售')}${chip('loan', '贷款')}${chip('scout', '侦察')}</div>`,
    right: box('也可以「过」', `${ic('pass', 26)} 同样要弃牌`) + box('出牌', '每个行动弃 1 张<br>只有建造挑牌') },
  { tag: '概念', left: `<svg class="net" viewBox="0 0 440 250"><g stroke-width="7" stroke-linecap="round"><path d="M70 190 190 120" stroke="#c0432e"/><path d="M190 120 320 70" stroke="#6b5d52"/><path d="M190 120 330 200" stroke="#6b5d52" stroke-dasharray="2 12"/></g>
      ${[[70, 190, '甲地', 1], [190, 120, '乙地', 1], [320, 70, '丙地', 0], [330, 200, '丁地', 0]].map(([x, y, n, mine]) => `<circle cx="${x}" cy="${y}" r="30" fill="${mine ? '#e9c9a8' : '#efe4cb'}" stroke="${mine ? '#c0432e' : '#6b5d52'}" stroke-width="4"/><text x="${x}" y="${y + 6}" text-anchor="middle" font-size="17" font-weight="700" fill="#2d241b">${n}</text>`).join('')}
      <rect x="58" y="146" width="24" height="16" rx="2" fill="#c0432e"/><text x="70" y="244" text-anchor="middle" font-size="13" fill="#efe4cb">你的产业</text><text x="20" y="22" font-size="14" fill="#efe4cb"><tspan fill="#e0735a">━</tspan> 你的连线　<tspan fill="#9c8f84">━</tspan> 别人的连线　<tspan fill="#9c8f84">┅</tspan> 空线路</text>
      <text x="320" y="122" text-anchor="middle" font-size="12" fill="#bfae98">不在你网络</text></svg>`,
    right: box('你的网络', '有你产业的地点<br>+ 与你连线相邻的地点') + box('连通', '有连续的连线<br>不论是谁的') },
  { tag: '资源', left: flow([{ icon: 'mine', t: '最近的煤矿', s: '连通 · 未翻面 · 免费' }, { icon: 'merchant', t: '煤市场', s: '需连通商人地点' }, { icon: 'coin', t: '市场空了', s: '每块 £8' }]),
    right: box('必须连通', `${ic('coal', 26)} 需要煤的地点<br>要连到煤源`) + box('用谁的', '任何人的煤矿都行<br>拿空就翻面') },
  { tag: '资源', left: flow([{ icon: 'works', t: '任意铁厂', s: '未翻面 · 免费' }, { icon: 'iron', t: '铁市场', s: '从便宜到贵' }, { icon: 'coin', t: '市场空了', s: '每块 £6' }]),
    right: box('不需连通', `${ic('iron', 26)} 铁可以从<br>任何地方拿`) + box('多块', '每块可来自<br>不同的铁厂') },
  { tag: '资源', left: `<div class="grid3">${chip('brewery', '自己的酿酒厂', '不需连通')}${chip('beer', '对手的酿酒厂', '必须连通')}${chip('merchant', '商人啤酒', '只在出售时')}</div>`,
    right: box('什么时候要', '出售：板块右上角<br>铁路时代一次建 2 条铁路') + box('多桶', '每桶可以<br>来自不同来源') },
  { tag: '建造', left: `<div class="cards"><div class="cd"><div class="cdh loc">地点牌</div><p>在牌上的地点<br>建任意产业<br><b>不必在网络内</b></p></div><div class="cd"><div class="cdh ind">产业牌</div><p>在你网络内<br>建牌上的产业</p></div><div class="cd wild"><div class="cdh">万能卡</div><p>当任意地点牌<br>或任意产业牌</p></div></div>`,
    right: box('选格', '有只画这种产业的格<br>→ 必须放那里<br>否则放双图标格') + box('农场酿酒厂', '只能用酿酒厂牌<br>或万能产业卡') },
  { tag: '建造', left: `<div class="two"><div class="col">${ic('canal', 54)}<b>运河时代</b><p>每个地点你最多<br><em>1</em> 块自己的产业</p></div><div class="col">${ic('rail', 54)}<b>铁路时代</b><p>同一地点<br>可以建多块</p></div></div>`,
    right: box('时代禁建图标', '玩家板格子左侧印着<br>对应图标的不能建') + box('一级产业', '铁路时代只有<br>一级陶瓷厂能建') },
  { tag: '建造', left: steps(['付费用：钱放角色板块，消耗煤、铁', '煤矿、铁厂放上方块；酿酒厂运河放 1 桶、铁路放 2 桶', '煤矿连通商人格 / 铁厂：立刻卖进市场', '卖空就翻面，收入按格前进']),
    right: box('只此一次', '方块只在建造那一刻<br>卖进市场') + box('先填最贵', '每块拿该格价格') },
  { tag: '建造', left: `<div class="two"><div class="col">${ic('build', 50)}<b>替换自己的</b><p>任何产业都行<br>剩的资源退回</p></div><div class="col">${ic('mine', 50)}<b>替换对手的</b><p>只限煤矿、铁厂<br>且全场没有这种方块</p></div></div>`,
    right: box('照付费用', '用同类<b>更高级</b>的<br>板块替换') + box('被替换的', '移出游戏、不计分<br>原主人已得的不扣') },
  { tag: '行动', left: table(['', '费用', '消耗'], [[`${ic('canal', 30)} 运河 ×1`, '£3', '—'], [`${ic('rail', 30)} 铁路 ×1`, '£5', `${ic('coal', 22)}×1`], [`${ic('rail', 30)} 铁路 ×2`, '£15', `${ic('coal', 22)}×2 ${ic('beer', 22)}×1`]]),
    right: box('放在哪', '空线路，与你网络<br>中的地点相邻') + box('两条铁路', '啤酒只能来自酿酒厂<br>不能用商人啤酒') },
  { tag: '行动', left: flow([{ icon: 'cotton', t: '选未翻面板块', s: '连通到收它的商人' }, { icon: 'beer', t: '付啤酒', s: '右上角数量' }, { icon: 'income', t: '翻面', s: '收入前进' }]) + `<div class="row3">${chip('cotton', '棉纺厂')}${chip('man', '制造厂')}${chip('pottery', '陶瓷厂')}</div>`,
    right: box('可以重复', '一次出售可以卖<br>多块，产业可不同') + box('没有啤酒', '拿不到需要的啤酒<br>就不能出售') },
  { tag: '商人', left: table(['商人', '啤酒奖励'], [['格洛斯特', `${ic('develop', 22)} 免费发展 1 次`], ['牛津', `${ic('income', 22)} 收入 +2 格`], ['诺丁汉 / 什鲁斯伯里', `${ic('vp', 22)} 加分（图中 3 / 4 分）`], ['沃灵顿', `${ic('coin', 22)} £5`]]),
    right: box('只在出售时', '用你卖给的那个<br>商人旁的啤酒') + box('补满', '运河时代结束<br>每格补 1 桶') },
  { tag: '行动', left: `<div class="grid3">${chip('develop', '发展', '拿掉 1–2 块 · 每块 1 铁')}${chip('loan', '贷款', '£30 · 收入退 3 级')}${chip('scout', '侦察', '弃 3 张 · 拿 2 张万能')}</div>`,
    right: box('灯泡陶瓷厂', `${ic('bulb', 26)} 不能发展<br>只能靠建造拿掉`) + box('贷款底线', '收入等级<br>不能低于 −10') },
  { tag: '概念', left: `<div class="two"><div class="col"><div class="row3 sm">${ic('cotton', 40)}${ic('man', 40)}${ic('pottery', 40)}</div><b>出售时翻面</b><p>棉纺厂 · 制造厂 · 陶瓷厂</p></div><div class="col"><div class="row3 sm">${ic('mine', 40)}${ic('works', 40)}${ic('brewery', 40)}</div><b>被拿空时翻面</b><p>煤矿 · 铁厂 · 酿酒厂</p></div></div>`,
    right: box('翻面的一面', '上半部黑色<br>左下角 = 时代末分数') + box('收入', '翻面立刻加收入<br>对手回合也一样') },
  { tag: '计分', left: steps([`连线：两端地点每个 ${ic('link', 22)} 得 1 分，计完移除`, '已翻面产业：按左下角得分', '<em>运河结束：</em>移除版图上所有一级产业', '<em>运河结束：</em>商人啤酒补满 1 桶', '<em>运河结束：</em>弃牌堆合洗（底牌翻正），每人抽 8 张']),
    right: box('连线图标', '已翻面产业板块上<br>商人名牌上') + box('二级以上', '留在版图上<br>铁路时代再计一次') },
  { tag: '胜负', left: `<div class="ladder">${['分数最高', '同分：收入等级高', '再同：剩下的钱多', '还同：并列'].map((t, i) => `<div style="margin-left:${i * 34}px"><i>${i + 1}</i>${t}</div>`).join('')}</div>`,
    right: box('不算分', '剩下的钱和收入等级<br>只用来比同分') },
  { tag: '提示', left: `<div class="tips">${[['loan', '别怕贷款', '终局收入不算分'], ['develop', '多用发展', '二级以上能计两次分'], ['brewery', '留住啤酒', '出售常常要啤酒'], ['rail', '铁路修向煤', '没煤就自己建煤矿']].map(([k, t, s]) => `<div>${ic(k, 40)}<b>${t}</b><small>${s}</small></div>`).join('')}</div>`,
    right: box('运河时代', '至少建掉或发展掉<br>一个煤矿、一个铁厂') }
];

/* ---------- page ---------- */
const titles = [...readFileSync(root + 'tools/讲解稿.md', 'utf8').matchAll(/^## (.+)$/gm)].map(m => m[1]);
if (titles.length !== S.length) throw new Error(`讲解稿 has ${titles.length} sections, slides ${S.length}`);
const css = `*{box-sizing:border-box;margin:0;padding:0}
body{width:800px;height:400px;overflow:hidden;font-family:"Noto Serif SC","Songti SC",serif;color:${C.cream}}
.sl{position:relative;width:800px;height:400px;padding:22px 26px;background:radial-gradient(ellipse at 30% 0%,#3a2c24 0%,#1c1613 70%);overflow:hidden}
.sl:before{content:"";position:absolute;inset:8px;border:1px solid rgba(201,154,69,.35);border-radius:6px;pointer-events:none}
.sl.full{background:linear-gradient(90deg,rgba(20,14,10,.92) 0,rgba(20,14,10,.55) 58%,rgba(20,14,10,.85) 100%),url(../../public/img/hero.jpg) center/cover}
.hd{display:flex;align-items:center;gap:10px}
.tag{padding:2px 7px;border:1px solid ${C.brass};color:${C.brass};font:600 12px "PingFang SC",sans-serif;letter-spacing:2px}
.br{margin-left:auto;font:500 12px "PingFang SC",sans-serif;letter-spacing:3px;color:#a8977c}
h1{margin-top:8px;font-size:32px;font-weight:900;letter-spacing:3px}
.ul{width:110px;height:2px;margin-top:6px;background:linear-gradient(90deg,${C.brass},transparent)}
.main{display:flex;gap:18px;margin-top:14px;height:280px}
.L{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;align-items:center}
.R{width:255px;display:flex;flex-direction:column;gap:10px;justify-content:center}
.box{border:1px solid rgba(201,154,69,.45);border-radius:6px;background:rgba(255,255,255,.04);padding:9px 12px}
.bh{font:900 15px "Noto Serif SC","Songti SC",serif;color:${C.brass};margin-bottom:4px}
.bb{font:500 14px/1.6 "PingFang SC",sans-serif;color:#e9dfca}
.bb b,.cap b{color:#f0c76a}
.ic{display:inline-flex;vertical-align:middle}
.chip{display:flex;flex-direction:column;align-items:center;gap:3px;padding:10px 8px;min-width:118px;border:1px solid rgba(201,154,69,.35);border-radius:8px;background:rgba(255,255,255,.05);text-align:center}
.chip b{font:700 15px "PingFang SC",sans-serif}
.chip small{font:12px/1.35 "PingFang SC",sans-serif;color:#cdbf9f}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;width:100%}
.grid3.acts .chip{padding:8px}
.grid4{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;width:100%}
.num{padding:12px;border:1px solid rgba(201,154,69,.35);border-radius:8px;background:rgba(255,255,255,.05);text-align:center}
.num b{display:block;font:600 40px/1.1 "Oswald","DIN Alternate",sans-serif;color:#f0c76a}
.num span{font:13px "PingFang SC",sans-serif;color:#d9cdb3}
.cap{margin-top:12px;font:13px "PingFang SC",sans-serif;color:#cdbf9f;text-align:center}
.flow{display:flex;align-items:center;gap:6px;width:100%;justify-content:center}
.step{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 6px;border:1px solid rgba(201,154,69,.35);border-radius:8px;background:rgba(255,255,255,.05);text-align:center;min-height:136px;justify-content:center}
.step b{font:700 15px "PingFang SC",sans-serif}
.step small{font:12px/1.4 "PingFang SC",sans-serif;color:#cdbf9f}
.arr{font:300 34px sans-serif;color:${C.brass};font-style:normal}
.arr.big{font-size:48px}
.tb{width:100%;border-collapse:collapse;font:14px "PingFang SC",sans-serif}
.tb th{padding:7px 8px;text-align:left;color:${C.brass};font:900 14px "Noto Serif SC","Songti SC",serif;border-bottom:1px solid rgba(201,154,69,.5)}
.tb td{padding:8px;border-bottom:1px solid rgba(201,154,69,.18);color:#efe4cb;white-space:nowrap}
.ord{display:flex;align-items:center;gap:14px}
.ordc{width:160px;padding:8px;border-radius:8px;background:rgba(0,0,0,.25);border:1px solid rgba(201,154,69,.35)}
.ordc em{display:block;font:600 12px "PingFang SC",sans-serif;font-style:normal;color:${C.brass};text-align:center;margin-bottom:4px}
.pl{display:flex;align-items:center;gap:8px;padding:4px 6px;font:600 15px "PingFang SC",sans-serif}
.pl i{width:20px;height:20px;border-radius:50%;background:#a03c24;font:600 12px/20px sans-serif;text-align:center;font-style:normal}
.pl span{flex:1}.pl b{font:600 16px "Oswald",sans-serif;color:#f0c76a}
.inc{display:flex;gap:4px}.inc span{width:34px;height:40px;border-radius:4px;background:rgba(255,255,255,.07);border:1px solid rgba(201,154,69,.3);font:600 17px/40px "Oswald",sans-serif;text-align:center;color:#d9cdb3}
.inc span.g0{background:rgba(201,154,69,.22)}.inc span.on{background:#c99a45;box-shadow:0 0 0 2px #f0c76a}
.chip small b{color:#f0c76a}
.cards{display:flex;gap:12px}
.cd{width:132px;height:178px;border-radius:9px;border:2px solid ${C.brass};background:#2e2420;overflow:hidden;text-align:center}
.cd.wild{background:repeating-linear-gradient(135deg,#2e2420 0 10px,#3a2e28 10px 20px)}
.cdh{padding:8px 0;font:900 16px "Noto Serif SC","Songti SC",serif;background:#5a443a}.cdh.loc{background:#4f6f8e}.cdh.ind{background:#a8432a}
.cd p{padding:14px 8px;font:14px/1.6 "PingFang SC",sans-serif;color:#e9dfca}.cd p b{color:#f0c76a}
.two{display:flex;gap:16px;width:100%}
.col{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;padding:16px 10px;border:1px solid rgba(201,154,69,.35);border-radius:8px;background:rgba(255,255,255,.05);text-align:center}
.col b{font:900 19px "Noto Serif SC","Songti SC",serif;color:#f0c76a}
.col p{font:14px/1.6 "PingFang SC",sans-serif;color:#e9dfca}.col p em{font:600 22px "Oswald",sans-serif;font-style:normal;color:#f0c76a}
.ol{list-style:none;counter-reset:n;width:100%;font:15px/1.45 "PingFang SC",sans-serif}
.ol li{counter-increment:n;display:flex;align-items:center;gap:10px;padding:7px 4px;border-bottom:1px solid rgba(201,154,69,.18)}
.ol li:before{content:counter(n);flex:none;width:24px;height:24px;border-radius:50%;background:#a03c24;font:600 13px/24px "Oswald",sans-serif;text-align:center}
.ol em{font-style:normal;color:${C.brass};font-weight:700}
.row3{display:flex;gap:10px;justify-content:center;margin-top:14px}.row3.sm{margin-top:0}.row3 .chip{min-width:100px}
.net{width:440px;height:250px;font-family:"PingFang SC",sans-serif}
.ladder{display:flex;flex-direction:column;gap:12px;width:100%}
.ladder div{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:8px;background:rgba(255,255,255,.06);border:1px solid rgba(201,154,69,.35);font:700 17px "PingFang SC",sans-serif;width:300px}
.ladder i{width:28px;height:28px;border-radius:50%;background:#c99a45;color:#2a1d08;font:600 15px/28px "Oswald",sans-serif;text-align:center;font-style:normal}
.tips{display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%}
.tips div{display:flex;flex-direction:column;align-items:center;gap:3px;padding:10px;border:1px solid rgba(201,154,69,.35);border-radius:8px;background:rgba(255,255,255,.05)}
.tips b{font:700 16px "PingFang SC",sans-serif}.tips small{font:12.5px "PingFang SC",sans-serif;color:#cdbf9f}
.cover{width:100%}
.cv-en{font:500 15px "Cinzel",Georgia,serif;letter-spacing:6px;color:${C.brass}}
.cv-t{margin-top:6px;font:900 26px "Noto Serif SC","Songti SC",serif;letter-spacing:4px}
.cv-row{display:flex;gap:14px;margin-top:22px}
.pc{display:inline-block;width:12px;height:12px;border-radius:50%}`;
const page = (s, i) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500&family=Oswald:wght@500;600&family=Noto+Serif+SC:wght@600;900&display=swap" rel="stylesheet">
<style>${css}</style></head><body><div class="sl ${s.full ? 'full' : ''}">
<div class="hd"><span class="tag">${String(i + 1).padStart(2, '0')} ${s.tag}</span><span class="br">工业革命 · 伯明翰</span></div>
<h1>${titles[i]}</h1><div class="ul"></div>
<div class="main"><div class="L"${s.full ? ' style="align-items:flex-start"' : ''}>${s.left}</div><div class="R">${s.right}</div></div></div></body></html>`;

mkdirSync(root + 'tools/.slides', { recursive: true });
const b = await chromium.launch({ channel: 'chrome' });
const p = await (await b.newContext({ viewport: { width: 800, height: 400 }, deviceScaleFactor: 1.5 })).newPage();
for (let i = 0; i < S.length; i++) {
  if (only && only !== i + 1) continue;
  const f = root + `tools/.slides/${String(i + 1).padStart(2, '0')}.html`;
  writeFileSync(f, page(S[i], i));
  await p.goto('file://' + f, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const over = await p.evaluate(() => [...document.querySelectorAll('.L,.R')].some(e => e.scrollHeight > e.clientHeight + 2 || e.scrollWidth > e.clientWidth + 2));
  if (over) console.log('overflow on slide', i + 1, titles[i]);
  await p.screenshot({ path: root + `public/guide/${String(i + 1).padStart(2, '0')}.jpg`, type: 'jpeg', quality: 82 });
}
await b.close();
console.log('rendered', only ?? S.length);
