// Teach page: a script the teacher reads aloud to start a first game, written from the official rulebook v2018.11
// (same wording as tools/讲解稿.md and tools/faq.json). It names every important element in a sentence and leaves the
// fine rulings to the rules assistant. Terms in {text|id} open a note with a picture cropped from the rulebook
// (img/teach/<icon>.webp); the 「问」 buttons and each note's 「问规则助手」 ask the rules assistant (chat.js) straight away.
// Same layout as the Pittsburgh site's teach page; the pictures are cut from Roxley's Birmingham rulebook, credited in the footer.
const ICON = (id, cls = '') => id ? `<img class="ico ${cls}" src="img/teach/${id}.webp" alt="">` : '';

// id: name, where you see it on the table, what it means. icon: a picture in img/teach/.
const TERMS = {
  era: { name: '时代', icon: 'canal', where: '游戏分两段：先是运河时代，再是铁路时代。', what: '每个时代的轮数固定：4 人局 8 轮、3 人局 9 轮、2 人局 10 轮。所有人打出最后的手牌那一轮结束，时代就结束，然后计一次分。' },
  vp: { name: '胜利点', icon: 'vp', where: '黑色六边形里的数字：翻过面的产业板块左下角、部分商人的奖励；版图外圈的进度轨记分。', what: '就是分数。铁路时代计完分，胜利点最多的人赢。' },
  link: { name: '连线图标', icon: 'link', where: '黑色六边形里一个双头箭头：翻过面的产业板块右上角、商人地点的名牌旁。', what: '时代结束时，你的每条运河或铁路，两头地点上每有一个连线图标，这条连线就得 1 分。' },
  tile: { name: '产业板块', icon: 'tile', where: '紫色方形板块：开局叠在玩家板上，建造后放到版图的地点上。', what: '你的工厂。左上角是等级；翻面后左下角是分数，右下角是收入加几格。' },
  flip: { name: '翻面', icon: 'flip', where: '产业板块上半部是黑色的那一面。', what: '棉纺厂、制造厂、陶瓷厂卖掉时翻面；煤矿、铁厂、酿酒厂上的煤、铁、啤酒被拿光时翻面。翻面时收入按右下角数字前进。时代结束时只有翻过面的板块计分。' },
  flipped: { name: '翻面后的板块', icon: 'flipped', where: '翻过面的产业板块：左下角黑色六边形、右下角带箭头的数字、右上角的连线图标。', what: '左下角是时代末得的分；右下角是翻面那一刻收入前进的格数；右上角的连线图标让连到这个地点的连线多得分。' },
  order: { name: '顺位轨', icon: 'order', where: '版图上一排格子，放着大家的角色板块。', what: '从前到后就是这一轮的行动顺序。轮末按这轮花的钱从少到多重排：花得少的先走。' },
  money: { name: '钱', icon: 'money', where: '1、5、15 镑的硬币，开局每人 17 镑。', what: '这一轮花掉的钱先放在自己的角色板块上，轮末按花了多少重排顺位，再还给银行。' },
  income: { name: '收入等级', icon: 'income', where: '版图外圈的进度轨：收入标记所在那一格旁边硬币上的数字。', what: '每轮结束按这个数拿钱，是负数就付钱。翻面按“格”前进，贷款按“等级”后退，两者不一样。' },
  card: { name: '地点牌和产业牌', icon: 'card', where: '手牌：地点牌写着一个地点名，产业牌画着一种产业。', what: '建造时要对的牌：地点牌在那个地点建任意产业；产业牌在你网络里的地点建牌上的产业。其他行动弃任意牌都行。' },
  wild: { name: '万能卡', icon: 'wild', where: '版图旁正面朝上的两堆：万能地点卡、万能产业卡。', what: '万能地点卡当任意地点牌，万能产业卡当任意产业牌。侦察行动拿到，用完放回原来那一堆。' },
  mat: { name: '玩家板', icon: 'mat', where: '每人面前一块，上面叠着自己颜色的产业板块。', what: '每种产业从最低等级开始一块块往上建。格子左边写着建造要的钱、煤、铁。' },
  level: { name: '产业等级', icon: 'level', where: '产业板块左上角的罗马数字。', what: '每种产业只能用玩家板上等级最低的那块。运河时代结束时，版图上的一级板块全部移走，二级以上留下。' },
  noera: { name: '时代禁建图标', icon: 'noera', where: '玩家板上格子左侧，半边涂黑的圆；运河时代、铁路时代各有一个。', what: '印着它的板块在那个时代不能建。一级产业里只有一级陶瓷厂能在铁路时代建，其余要在运河时代建掉或发展掉。' },
  lightbulb: { name: '灯泡图标', icon: 'lightbulb', where: '部分陶瓷厂板块上。', what: '印着灯泡的陶瓷厂不能用发展拿掉，只能靠建造从玩家板上拿走。' },
  develop: { name: '发展', icon: 'develop', where: '六种行动之一。', what: '弃一张牌，从玩家板拿掉 1～2 块等级最低的板块放回盒子，每块付 1 铁，好早点用上高级板块。' },
  cotton: { name: '棉纺厂', icon: 'tile', where: '玩家板上的棉纺厂一列。', what: '可以出售的产业之一，卖给收棉的商人，通常要啤酒。' },
  manuf: { name: '制造厂', icon: 'manuf', where: '玩家板上的制造厂一列。', what: '可以出售的产业之一，卖给收制成品的商人，通常要啤酒。' },
  pottery: { name: '陶瓷厂', icon: 'pottery', where: '玩家板上的陶瓷厂一列。', what: '可以出售的产业之一，卖给收陶瓷的商人。一级陶瓷厂是唯一能在铁路时代建的一级产业；印着灯泡的不能发展。' },
  coalmine: { name: '煤矿', icon: 'coalmine', where: '玩家板上的煤矿一列。', what: '建好时放上煤；和任一商人格连通，就先把煤尽量卖进煤市场。煤被拿光时翻面。' },
  ironworks: { name: '铁厂', icon: 'ironworks', where: '玩家板上的铁厂一列。', what: '建好时放上铁，不用连通就先把铁尽量卖进铁市场。铁被拿光时翻面。' },
  brewery: { name: '酿酒厂', icon: 'brewery', where: '玩家板上的酿酒厂一列。', what: '建好时放啤酒：运河时代 1 桶，铁路时代 2 桶。啤酒被拿光时翻面。' },
  beerreq: { name: '所需啤酒', icon: 'manuf', where: '未翻面的棉纺厂、制造厂、陶瓷厂右上角的小酒桶。', what: '画着几个酒桶，出售这块板块就要几桶啤酒；没画就不用。' },
  canal: { name: '运河', icon: 'canal', where: '连线板块的运河一面，放在版图上的运河线上。', what: '运河时代只能建运河，1 条 3 镑。运河时代结束计分后拿走。' },
  rail: { name: '铁路', icon: 'rail', where: '连线板块的铁路一面，放在版图上的铁路线上。', what: '铁路时代只能建铁路：1 条 5 镑加 1 煤；或者一次建 2 条，共 15 镑，每条 1 煤，再加 1 桶酿酒厂的啤酒。' },
  location: { name: '地点', icon: 'location', where: '版图上带名牌的城镇，每个有一到几个产业空格。', what: '产业板块建在地点的空格上。有只画着这种产业的空格就必须建在那里。' },
  network: { name: '网络', icon: 'location', where: '看版图上你的板块。', what: '有你产业板块的地点，加上和你的连线相邻的地点。用产业牌建造、放连线，都要在你的网络里（版图上还没有你任何板块时除外）。' },
  connected: { name: '连通', icon: 'rail', where: '看版图上的连线。', what: '两个地点之间有一串连续的连线板块，不管是谁的，就算连通。用煤、用别人的啤酒、出售都要连通。' },
  market: { name: '煤市场和铁市场', icon: 'market', where: '版图上标着价格的两列格子。', what: '买煤、铁时从最便宜的格买起；新建的煤矿、铁厂会把方块先卖进市场，从最贵的格卖起，每块拿那一格的钱。' },
  coal: { name: '煤', icon: 'coal', where: '黑色方块：煤矿板块上、煤市场里。', what: '建铁路和部分产业要用。必须从连通的煤矿拿，或连通到商人后去煤市场买。' },
  iron: { name: '铁', icon: 'iron', where: '橙色方块：铁厂板块上、铁市场里。', what: '发展时每拿掉一块付 1 铁，部分产业建造也要。用铁不需要连通。' },
  beer: { name: '啤酒', icon: 'beer', where: '酒桶：酿酒厂板块上、商人旁的啤酒格。', what: '出售大多要用；铁路时代一次建两条铁路也要 1 桶。自己的酿酒厂不用连通，别人的要连通。' },
  merchant: { name: '商人', icon: 'merchant', where: '版图边上的商人板块，画着它收哪些产业。', what: '出售时，板块要连通到画有这种产业图标的商人。2、3 人局有的商人格不放板块，那里不能卖货。' },
  mbeer: { name: '商人啤酒', icon: 'mbeer', where: '商人旁的酒桶格，开局有商人的各放 1 桶。', what: '卖货给这个商人时可以用它，用了就拿这个商人的奖励。时代中不补，运河时代结束时补满。' },
  bonus: { name: '商人奖励', icon: 'bonus', where: '商人地点旁的图标。', what: '格洛斯特：免费发展一次；牛津：收入前进 2 格；诺丁汉、什鲁斯伯里：加分；沃灵顿：拿 5 镑。用了商人啤酒才能拿。' },
  farm: { name: '农场酿酒厂', icon: 'farm', where: '版图上两个没有名字、只有一个酿酒厂空格的地点。', what: '只能用酿酒厂产业牌或万能产业卡建，万能地点卡不行。' },
  overbuild: { name: '覆盖建造', icon: 'level', where: '建造时可以选择。', what: '用同类更高等级的板块替换已建好的板块。自己的都能换；别人的只能换煤矿或铁厂，而且版图和市场上已经没有这种方块。' }
};

// The script: what to read aloud. Every important element gets one sentence; how it is ruled exactly is for the assistant.
const PARTS = [
  { title: '怎么赢', sec: 25, lines: [
    '这局玩《工业革命：伯明翰》。我先讲一遍主流程，讲完再一条条过注意事项。',
    '我们是 1770 年伯明翰一带的实业家：开工厂、挖煤炼铁、酿啤酒，修运河和铁路。',
    '游戏分运河、铁路两个{时代|era}，铁路时代打完，{胜利点|vp}最多的人赢。',
    '分数主要来自两处：{翻过面|flip}的{产业板块|tile}左下角的分；还有你的{运河|canal}和{铁路|rail}，两头地点上的{连线图标|link}越多越值钱。'
  ], ask: ['时代结束怎么计分？', '哪些产业靠出售翻面，哪些不是？'] },
  { title: '一轮怎么走', sec: 30, lines: [
    '按{顺位轨|order}轮流，每人做 2 个行动，可以重复；只有运河时代第一轮，每人只做 1 个。',
    '每个行动都要弃一张手牌，做完补回 8 张。4 人局每个时代 8 轮，3 人 9 轮，2 人 10 轮。',
    '这一轮花的{钱|money}放在自己的角色板块上，轮末花得少的下一轮先走。',
    '然后每人按{收入等级|income}拿钱；收入是负的就付钱。'
  ], ask: ['下一轮的顺位怎么决定？花费相同怎么办？', '每个行动都要弃牌吗？「过」也要吗？', '付不起负收入会怎样？'] },
  { title: '你的玩家板', sec: 35, lines: [
    '{玩家板|mat}上有六种产业：{棉纺厂|cotton}、{制造厂|manuf}、{陶瓷厂|pottery}靠卖货翻面；{煤矿|coalmine}、{铁厂|ironworks}、{酿酒厂|brewery}产出煤、铁和啤酒。',
    '每种产业只能用等级最低的那块，板块左上角是{等级|level}，越往后越值钱。',
    '格子左边是建造费用：钱，有的还要煤或铁。印着{时代禁建图标|noera}的，那个时代不能建。',
    '一级产业铁路时代基本不能建，挡路的低级板块可以用发展扔掉。'
  ], ask: ['运河时代和铁路时代建造有什么不同？', '二级以上产业会计两次分吗？'] },
  { title: '六种行动', sec: 70, lines: [
    '**建造**：弃一张{地点牌或产业牌|card}，把板块放到{地点|location}的空格上，付钱和{煤|coal}、{铁|iron}。',
    '**网络**：放一条连线，扩大你的{网络|network}。运河时代建{运河|canal}，3 镑；铁路时代建{铁路|rail}，5 镑加 1 煤。',
    '**出售**：把棉、制成品、陶瓷卖给{连通|connected}的{商人|merchant}，按板块右上角付{啤酒|beerreq}。用了商人旁的{啤酒|mbeer}还拿{奖励|bonus}。卖掉的板块翻面，收入上涨。',
    '**发展**：每块付 1 铁，扔掉玩家板上一两块低级板块。',
    '**贷款**：拿 30 镑，收入降 3 级。',
    '**侦察**：弃三张牌，换一张万能地点卡和一张万能产业卡，就是{万能卡|wild}。',
    '也可以「过」，但同样要弃牌。'
  ], ask: ['地点牌、产业牌、万能卡分别怎么用？', '出售行动怎么做？', '网络行动建一条连线要多少钱？'] },
  { title: '煤、铁和啤酒', sec: 40, lines: [
    '{煤矿|coalmine}建好放{煤|coal}，{铁厂|ironworks}放{铁|iron}，{酿酒厂|brewery}放{啤酒|beer}。煤和铁能卖进{市场|market}就先卖，每块拿钱。',
    '用煤要{连通|connected}：先从最近的煤矿免费拿，连不到煤矿才去煤市场买。用铁不用连通：先从任何铁厂免费拿，没有才去铁市场买。',
    '啤酒：自己酿酒厂的随便用，别人的要连通，卖货时还能用商人旁的啤酒。别人板块上的东西也是免费拿。',
    '板块上的煤、铁、啤酒被拿光，它就{翻面|flip}，主人加收入。'
  ], ask: ['煤从哪里拿？一定要连通吗？', '啤酒从哪里来？要连通吗？', '建好煤矿、铁厂，方块什么时候卖进市场？'] },
  { title: '时代结束', sec: 30, lines: [
    '大家手牌打光的那一轮结束，时代就结束。',
    '计两项分：你的每条连线，两头地点上有几个{连线图标|link}就得几分，计完拿走；每个{翻过面|flip}的产业板块按左下角得分。',
    '运河时代结束后：版图上的一级产业全部移走，商人啤酒补满，弃牌洗好每人再摸 8 张，进入铁路时代。',
    '铁路时代打完，{胜利点|vp}最多的人赢。流程就这些，接下来过一遍注意事项。'
  ], ask: ['运河时代结束后还要做什么？', '终局同分怎么判？'] }
];

// 注意事项: fine points outside the main flow that are easy to get wrong. Read them one by one after the script.
// Each has a written answer (from tools/faq.json, i.e. the rulebook); what is not here goes to the rules assistant.
// [title, answer, question for the assistant]
const NOTES = [
  ['花的钱一样多，顺位怎么排', '保持原来的先后不变。花掉的钱先放在自己的角色板块上，轮末排完顺位再一起还给银行。', '下一轮的顺位怎么决定？花费相同怎么办？'],
  ['每个行动都要弃牌，「过」也要', '每个行动弃 1 张（侦察弃 3 张）；选择「过」，每跳过一个行动也要弃 1 张。{万能卡|wild}用完放回原来那一堆，不进弃牌堆。', '每个行动都要弃牌吗？「过」也要吗？'],
  ['收入的“格”和“等级”', '翻面、牛津奖励让收入按格前进，走几格可能只升一两级；贷款按等级后退 3 级，标记放在新等级的最高一格。收入等级最高 30。全局最后一轮结束后不收收入。', '收入「等级」和「格」有什么区别？'],
  ['付不起负收入', '拆掉自己版图上的产业板块换钱（不能拆连线），每块值建造费用的一半，向下取整；够了就停，多的钱归你。拆完还不够，每差 1 镑扣 1 分。', '付不起负收入会怎样？'],
  ['用哪种牌建造', '{地点牌|card}：在牌上的地点建任意产业，不必在你的网络里。产业牌：在你网络里的地点建牌上画的产业；版图上还没有你任何板块时，可以建在任意有这种空格的地点。万能地点卡当任意地点牌，万能产业卡当任意产业牌。', '地点牌、产业牌、万能卡分别怎么用？'],
  ['建在哪个空格', '地点里有只画着这种产业的空格，就必须建在那里；没有，才建在画着它和另一种产业的空格；都没有就不能在这里建（{覆盖建造|overbuild}除外）。', '一个地点有几个空格，建在哪一格？'],
  ['运河时代一个地点只能有一块', '运河时代，每个{地点|location}你自己最多 1 块产业板块，可以和别人的在同一地点；铁路时代没有这个限制。', '运河时代和铁路时代建造有什么不同？'],
  ['一级产业留到铁路时代就建不了', '印着{时代禁建图标|noera}的板块在那个时代不能建。一级产业里只有一级陶瓷厂能在铁路时代建；其余一级板块留在玩家板上会挡住高级的，只能用发展拿掉。', '一级产业在铁路时代还能建吗？'],
  ['煤和铁只在建好那一刻卖进市场', '建煤矿时连通到任一商人格（没放商人板块的也算），或者建铁厂（不用连通），立刻把尽量多的方块卖进{市场|market}，先填最贵的格，每块拿那一格的钱。卖空就翻面。之后不会再卖。', '建好煤矿、铁厂，方块什么时候卖进市场？'],
  ['煤要连通，铁不用', '煤：先从最近的、连通的、未翻面的煤矿免费拿；连不到才去煤市场买，还要连通到商人地点，市场空了每块 8 镑。铁：先从任意未翻面的铁厂免费拿；没有才去铁市场买，空了每块 6 镑。', '煤从哪里拿？一定要连通吗？'],
  ['用别人的煤、铁、啤酒不用给钱', '从任何人未翻面的板块上拿资源都免费。被拿空的板块翻面，主人加收入。', '用对手的煤、铁、啤酒要给钱吗？'],
  ['啤酒的三个来源', '自己的酿酒厂：不用连通。别人的酿酒厂：要和需要啤酒的地点连通。商人旁的{啤酒|mbeer}：只有卖给那个商人时能用。需要好几桶时可以混着用。', '啤酒从哪里来？要连通吗？'],
  ['出售要连通到对的商人', '每块要卖的板块，都要连通到画着它产业图标的{商人|merchant}。2、3 人局没放商人板块的商人格（如沃灵顿、诺丁汉）不能卖货。', '2、3 人局没放商人板块的商人地点（如沃灵顿、诺丁汉），还能往那里卖货吗？'],
  ['商人啤酒和奖励', '用了商人旁的啤酒才拿{奖励|bonus}：格洛斯特免费发展一次（不用铁）；牛津收入前进 2 格；诺丁汉、什鲁斯伯里加分；沃灵顿拿 5 镑。商人啤酒时代中不补，运河时代结束时补满。', '商人啤酒奖励有哪些？'],
  ['一次建两条铁路', '铁路时代一次网络行动可以建 2 条，共 15 镑，每条 1 煤，另加 1 桶酿酒厂的啤酒（不能用商人啤酒）。运河时代一次只能建 1 条运河。', '网络行动建一条连线要多少钱？'],
  ['覆盖建造', '可以用同类更高等级的板块替换已建好的板块，照常付费。自己的都能换；别人的只能换煤矿或铁厂，而且整个版图和市场上已经没有这种方块。换下的板块不计分，原主人已得的收入和分数不扣。', '能覆盖建造吗？'],
  ['发展和灯泡', '一次可以拿掉 1～2 块，产业可以不同，但都必须是该产业等级最低的，每块付 1 铁。印着{灯泡|lightbulb}的陶瓷厂不能发展，只能靠建造拿掉。', '发展行动怎么做？'],
  ['贷款和侦察的限制', '贷款会让收入等级低于 -10 时不能贷，贷了永不偿还。手里已经有万能卡时不能侦察。', '贷款行动怎么做？有限制吗？'],
  ['农场酿酒厂', '两个无名的{农场酿酒厂|farm}只能用酿酒厂产业牌或万能产业卡建。坎诺克到它左边那个要一条连线；基德明斯特—伍斯特那条连线同时连着另一个，不需要也不能再放。', '农场酿酒厂怎么建？'],
  ['二级以上计两次分，平局怎么判', '运河时代结束只移走一级产业，二级以上翻过面的，铁路时代结束再计一次分。终局同分先比收入等级，再比剩下的钱；钱和收入本身不算分。', '二级以上产业会计两次分吗？']
];

// Icon guide, grouped the way things sit on the table.
const GROUPS = [
  ['分数和钱', ['vp', 'link', 'money', 'income']],
  ['手牌和顺位', ['card', 'wild', 'order']],
  ['玩家板', ['mat', 'level', 'noera', 'lightbulb', 'develop']],
  ['产业种类', ['cotton', 'manuf', 'pottery', 'coalmine', 'ironworks', 'brewery']],
  ['产业板块', ['tile', 'flip', 'flipped', 'beerreq']],
  ['连线', ['canal', 'rail']],
  ['版图', ['location', 'merchant', 'mbeer', 'bonus', 'market', 'farm']],
  ['资源', ['coal', 'iron', 'beer']]
];

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const term = (text, id) => `<button type="button" class="term" data-t="${id}">${ICON(TERMS[id].icon)}${esc(text)}</button>`;
const line = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\{([^|}]+)\|(\w+)\}/g, (_, t, id) => term(t, id));
// inside a button the terms show their icon but are not buttons themselves
const label = s => esc(s).replace(/\{([^|}]+)\|(\w+)\}/g, (_, t, id) => `<span class="tlab">${ICON(TERMS[id].icon)}${esc(t)}</span>`);
const askBtn = (text, q) => `<button type="button" class="tq" data-q="${esc(q)}">问 <span>${label(text)}</span></button>`;

document.getElementById('teach').innerHTML = `
  <p class="tlead">讲的人先照着念主流程（三四分钟），再一条条过注意事项。<b>带下划线的词</b>点一下看图和解释；有疑问点「问」，规则助手马上回答。</p>
  <nav class="tnav">${PARTS.map((p, i) => `<a href="#p${i + 1}"><i>${i + 1}</i>${p.title}</a>`).join('')}<a href="#later">注意事项</a><a href="#icons">图标速查</a></nav>
  ${PARTS.map((p, i) => `<section class="card tpart" id="p${i + 1}">
    <h2 class="h"><span><i>${i + 1}</i>${p.title}</span><small>约 ${p.sec} 秒</small></h2>
    ${p.lines.map(s => `<p class="tline">${line(s)}</p>`).join('')}
    <div class="tasks"><em>桌上常见疑问</em>${p.ask.map(q => askBtn(q, q)).join('')}</div>
  </section>`).join('')}
  <section class="card tpart" id="later">
    <h2 class="h"><span><i>✓</i>注意事项</span><small>${NOTES.length} 条</small></h2>
    <p class="tnote">流程讲完后，一条一条过一遍。都是规则书里写了、但最容易漏掉或吵起来的地方。点开就是答案。</p>
    <div class="tnotes">${NOTES.map(([t, a, q], i) => `<details class="tni"><summary><i>${i + 1}</i>${esc(t)}</summary><p>${line(a)}</p>${askBtn('还有疑问？问规则助手', q)}</details>`).join('')}</div>
    <p class="tnote">注意事项里没有的，点右下角「规则」问 AI，本站资料查不到会联网找。</p>
  </section>
  <a class="btn tgo" href="/">讲完了，去建房间</a>
  <h2 class="h" id="icons">图标速查<small>点图标看解释</small></h2>
  ${GROUPS.map(([g, ids]) => `<div class="card tgrid"><h3>${g}</h3><div>${ids.map(id => `<button type="button" class="tic" data-t="${id}">${ICON(TERMS[id].icon)}<span>${TERMS[id].name}</span></button>`).join('')}</div></div>`).join('')}
  <footer>依据官方规则书 v2018.11 · 图片截自 Roxley 官方规则书（<a href="https://roxley.com/brass-birmingham-rulebook" target="_blank" rel="noopener">原文</a>），版权归 Roxley Games 所有 · 非官方玩家工具</footer>`;

// The note for a term: a sheet from the bottom with the icon, where it is and what it means.
const sheet = document.createElement('div');
sheet.className = 'tsheet hidden';
document.body.appendChild(sheet);
const close = () => sheet.classList.add('hidden');
function show(id) {
  const t = TERMS[id];
  sheet.innerHTML = `<div class="tsbg"></div><div class="tsbox" role="dialog" aria-label="${esc(t.name)}">
    <div class="tshd">${ICON(t.icon, 'big')}<b>${esc(t.name)}</b><button type="button" class="tsx" aria-label="关闭">×</button></div>
    <p><em>在哪儿看到</em>${esc(t.where)}</p><p><em>什么意思</em>${esc(t.what)}</p>
    <button type="button" class="btn navy tsask" data-q="${esc(`「${t.name}」是什么，怎么用？`)}">还不懂？问规则助手</button></div>`;
  sheet.classList.remove('hidden');
}
const ask = q => { close(); window.askRules?.(q); };
document.addEventListener('click', e => {
  const t = e.target.closest('[data-t]');
  if (t) return show(t.dataset.t);
  const q = e.target.closest('[data-q]');
  if (q) return ask(q.dataset.q);
  if (e.target.closest('.tsx,.tsbg')) close();
});
addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
