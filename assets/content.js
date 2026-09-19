(function (root, factory) {
  var api = factory();
  root.MoonContent = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var skins = [
    { id: 'snow', name: '云白冰皮', note: '摸上去像一团没说完的话。', color: '#dedfd8', accent: '#aeb7aa', deltas: { novelty: -22, emotion: 8, decorum: 14 } },
    { id: 'amber', name: '琥珀广式', note: '熟悉，但不准备为熟悉道歉。', color: '#b96f35', accent: '#71361f', deltas: { novelty: -30, control: 10, boundary: 14 } },
    { id: 'tea', name: '茶青酥皮', note: '一碰会掉一点很安静的碎屑。', color: '#879078', accent: '#4d5947', deltas: { novelty: 14, emotion: -10, aftertaste: 20 } },
    { id: 'charcoal', name: '墨黑竹炭', note: '月亮偶尔也想把灯关掉。', color: '#393a37', accent: '#171816', deltas: { novelty: 30, boundary: 20, decorum: -12 } },
  ];

  var fillings = [
    { id: 'lotus', name: '莲蓉', note: '稳稳放在里面，不抢话。', color: '#c99c62', deltas: { novelty: -28, emotion: 2, boundary: 12 } },
    { id: 'sesame', name: '黑芝麻', note: '话少，余味倒是很长。', color: '#34302d', deltas: { emotion: 16, aftertaste: 30, decorum: 14 } },
    { id: 'osmanthus', name: '桂花酒酿', note: '甜意来得晚，酒意更晚。', color: '#d7aa55', deltas: { novelty: 12, emotion: 28, aftertaste: 24 } },
    { id: 'custard', name: '海盐奶黄', note: '先软一下，再认真回嘴。', color: '#e0b756', deltas: { novelty: 8, emotion: 20, intuition: 12 } },
    { id: 'coffee', name: '冷萃咖啡', note: '清醒是真的，想睡也是真的。', color: '#70452f', deltas: { novelty: 24, emotion: -8, boundary: 16 } },
  ];

  var blends = [
    { id: 'yolk-flow', left: '蛋黄', right: '流心', colors: ['#d78b2d', '#f1c76e'], deltas: { emotion: 20, control: 8 } },
    { id: 'cocoa-salt', left: '黑巧', right: '海盐', colors: ['#4c2e25', '#d7d0bd'], deltas: { emotion: 12, boundary: 16 } },
    { id: 'plum-flower', left: '酸梅', right: '桂花', colors: ['#783a45', '#c9993d'], deltas: { novelty: 18, aftertaste: 18 } },
    { id: 'coffee-custard', left: '咖啡', right: '奶黄', colors: ['#68402d', '#e3bd62'], deltas: { novelty: 12, intuition: -8 } },
  ];

  var surprises = [
    { id: 'truffle-snack', name: '黑松露辣条', form: '一根穿礼服的辣条', color: '#8e2d24', deltas: { novelty: 42, boundary: 14, decorum: -18 } },
    { id: 'vinegar', name: '老陈醋', form: '一滴悬着不落的黑琥珀', color: '#5a3027', deltas: { novelty: 24, aftertaste: 28 } },
    { id: 'coriander', name: '香菜', form: '三片态度鲜明的叶子', color: '#638151', deltas: { novelty: 18, boundary: 30 } },
    { id: 'iced-americano', name: '冰美式续命', form: '一块冒冷气的褐色冰砖', color: '#6b483a', deltas: { novelty: 12, emotion: -16, decorum: 12 } },
    { id: 'boss-pie', name: '老板画的饼', form: '漂亮、空心，还在发光', color: '#be7b3e', deltas: { novelty: 20, intuition: -18, boundary: -14 } },
    { id: 'read-no-reply', name: '已读不回', form: '揉皱后又摊平的小纸条', color: '#a3947e', deltas: { emotion: 30, aftertaste: 34, decorum: 20 } },
    { id: 'monday-battery', name: '周一剩余电量', form: '只剩一格的旧电池', color: '#9c8b54', deltas: { emotion: -12, intuition: -10, aftertaste: 18 } },
    { id: 'after-work-air', name: '下班后的第一口空气', form: '一只快要散开的透明气泡', color: '#91a9a2', deltas: { emotion: 16, intuition: 24, boundary: 12 } },
    { id: 'moon-shard', name: '月光碎片', form: '边缘很薄的银色切片', color: '#d7d4bd', deltas: { novelty: 28, emotion: 22, aftertaste: 16 } },
    { id: 'flower-wind', name: '桂花晚风', form: '一小束正在转身的金线', color: '#c7a34c', deltas: { emotion: 24, intuition: 20, decorum: 8 } },
    { id: 'late-reunion', name: '迟到的团圆', form: '缺了角的两枚木扣', color: '#9c6d52', deltas: { emotion: 38, aftertaste: 32 } },
    { id: 'home-countdown', name: '回家倒计时', form: '字迹逐渐褪色的小车票', color: '#8a7665', deltas: { emotion: 26, aftertaste: 28, control: 10 } },
  ];

  var fates = [
    { id: 'safe-fresh', left: { label: '稳妥', deltas: { novelty: -34, control: 18 } }, right: { label: '新鲜', deltas: { novelty: 34, intuition: 16 } } },
    { id: 'proper-tasty', left: { label: '体面', deltas: { decorum: 36, control: 12 } }, right: { label: '好吃', deltas: { intuition: 30, emotion: 14 } } },
    { id: 'wind-coffee', left: { label: '桂花晚风', deltas: { emotion: 24, aftertaste: 18 } }, right: { label: '冰美式续命', deltas: { emotion: -22, boundary: 18 } } },
    { id: 'home-wait', left: { label: '回家', deltas: { emotion: 18, intuition: 14 } }, right: { label: '再等等', deltas: { aftertaste: 30, control: 16 } } },
    { id: 'leave-all', left: { label: '留一点', deltas: { control: 22, decorum: 16 } }, right: { label: '全部放进去', deltas: { emotion: 34, intuition: 20 } } },
    { id: 'say-forget', left: { label: '说出来', deltas: { decorum: -24, intuition: 22 } }, right: { label: '算了', deltas: { decorum: 28, aftertaste: 24 } } },
    { id: 'round-real', left: { label: '做圆', deltas: { control: 26, decorum: 24 } }, right: { label: '做自己', deltas: { boundary: 34, novelty: 14 } } },
    { id: 'now-later', left: { label: '趁现在', deltas: { intuition: 32, aftertaste: -18 } }, right: { label: '等合适', deltas: { control: 24, aftertaste: 22 } } },
  ];

  var stamps = [
    { id: 'light', label: '今晚有光', mark: '光', deltas: { emotion: 14, decorum: 10 } },
    { id: 'relax', label: '圆得差不多', mark: '○', deltas: { control: -28, boundary: 16 } },
    { id: 'eat-first', label: '吃完再说', mark: '吃', deltas: { intuition: 26, aftertaste: -12 } },
    { id: 'home-line', label: '一条回家的线', mark: '⌁', deltas: { emotion: 18, aftertaste: 22 } },
  ];

  var archetypes = {
    NCEI: { name: '清醒发疯 · 冰美式流心型', line: '你知道边界在哪，也知道什么时候可以踩过去半步。', essay: '你不是冲动。真正让你兴奋的，是把一件看起来不该成立的事，做得居然有点靠谱。别人看到的是突然，你自己清楚，前面已经悄悄量过三次火候。', relation: '一个接得住玩笑，也尊重你认真时刻的人。', cannotStand: '把“为你好”当成万能通行证。', tonight: '月亮可以很圆，做法不必太规矩。' },
    NCEA: { name: '有边界的野心 · 焦糖咖啡型', line: '你想要新的，但不准备把方向盘交出去。', essay: '你会主动靠近陌生东西，却很少真的失控。新鲜感对你不是烟花，更像一次有准备的偏航：路线可以改，目的地得由你决定。', relation: '一个不压住你的锋芒，也不会替你收尾的人。', cannotStand: '临时起意以后，把代价留给别人。', tonight: '想走远一点，先把自己的火看稳。' },
    NCRI: { name: '月下失重 · 酸梅桂花型', line: '你愿意冒险，但心里总留着一块旧月色。', essay: '你对新东西很敏感，也很容易被某个细节突然击中。看起来走得快，真正舍不得的东西却会在后面追很久。你的反骨不吵，它常常藏在一次不解释的选择里。', relation: '一个允许情绪晚点到、不催你立刻命名的人。', cannotStand: '把复杂感受压成一个标准答案。', tonight: '有些重量，要离地以后才感觉得到。' },
    NCRA: { name: '天生反骨 · 竹炭海盐型', line: '你不是爱唱反调，只是不愿把默认选项当答案。', essay: '遇到一条人人都走的路，你会本能地看看旁边有没有门。你做决定并不轻率，只是判断标准更私有，也更难被一句“大家都这样”说服。', relation: '一个能讨论、不用服从来证明亲近的人。', cannotStand: '没有理由的规矩和没有内容的共识。', tonight: '月亮被看了很多年，你还是可以换个角度。' },
    NLEI: { name: '随地自洽 · 酒酿流心型', line: '别人负责意外，你负责把意外吃出道理。', essay: '你对陌生事物的接受度很高，甚至擅长在混乱里长出自己的秩序。你不急着证明选择正确，先尝一口，再决定要不要把它留下。', relation: '一个不替你定义正常，也愿意一起试错的人。', cannotStand: '还没开始就被劝回安全区。', tonight: '配方没有正解，吃得下就是一种回答。' },
    NLEA: { name: '浪漫务实 · 桂花奶黄型', line: '你会接住晚风，也记得把门关好。', essay: '你愿意相信气氛、直觉和一点偶然，但不会因此忘记现实。浪漫在你这里不是失去判断，而是判断清楚以后，仍然决定留一点没有用的美。', relation: '一个会陪你看月亮，也会顺手带伞的人。', cannotStand: '拿现实感当作嘲笑温柔的理由。', tonight: '好看的月色，也可以照进具体生活。' },
    NLRI: { name: '先疯再说 · 辣条月光型', line: '你把犹豫留给以后，先让这一口发生。', essay: '你很少把自己困在无数预案里。喜欢就靠近，不喜欢就放下，偶尔也会因为走得太快，在夜里重新回看当时没看清的部分。', relation: '一个不会扫兴，也敢在必要时拉你一把的人。', cannotStand: '把所有可能性讨论到失去味道。', tonight: '趁月亮还热，先咬一口。' },
    NLRA: { name: '松弛试吃 · 半块月亮型', line: '你允许事情先不完整，反而更容易走下去。', essay: '你对结果没有那么强的控制欲，愿意让过程自己长出形状。新的东西可以尝，旧的习惯也不用急着丢；你真正擅长的是不过度为一次选择加戏。', relation: '一个不把每次沉默都解释成问题的人。', cannotStand: '为了显得认真，把轻松也做成任务。', tonight: '圆得差不多，就已经可以分享。' },
    FCEI: { name: '礼貌崩溃 · 海盐莲蓉型', line: '外面做得很圆，里面其实挺有意见。', essay: '你不喜欢把事情弄得难看，所以即使已经不耐烦，还是会把最后一句话说完整。情绪不是没有，只是习惯先关小火，等别人走了，它才慢慢滚起来。', relation: '一个能听懂“没事”有几种意思的人。', cannotStand: '别人嘴上说随便，最后又否掉你的选择。', tonight: '体面可以留，委屈不用全吞。' },
    FCEA: { name: '过分体面 · 琥珀莲蓉型', line: '你连失望都收拾得很整齐。', essay: '你熟悉规则，也知道如何让局面保持好看。很多时候你不是没有情绪，而是觉得情绪也该有摆放的位置。只是偶尔，收拾得太快会让别人误以为你从没受影响。', relation: '一个不会利用你的周全、愿意主动补位的人。', cannotStand: '把你的克制当成理所当然。', tonight: '有些裂缝不必立刻抹平。' },
    FCRI: { name: '嘴硬心软 · 黑芝麻型', line: '你先把话说硬，再悄悄把灯留着。', essay: '你做决定时看起来很稳，真正牵动你的却常常是关系里的小事。你不擅长立刻交付柔软，于是关心会绕个弯，藏进一句提醒或一个没署名的动作。', relation: '一个不逼你承认心软，却看得见的人。', cannotStand: '当众拆穿你留好的台阶。', tonight: '回甘晚一点，也还是甜。' },
    FCRA: { name: '稳定内耗 · 五味回甘型', line: '你很少失控，只是脑内开会从不散场。', essay: '你习惯把选择拆开、比较，再替每一种结果预演后果。别人看到的是稳，你知道那份稳来自大量无声计算。好处是很少翻车，代价是休息也容易带着任务感。', relation: '一个能给明确回应、不让你一直猜的人。', cannotStand: '模糊承诺和临时改变标准。', tonight: '不是每一口，都需要写完风险报告。' },
    FLEI: { name: '慢热回甘 · 桂花酒酿型', line: '你不是不热，只是很多东西要多焖一会儿。', essay: '熟悉感会让你放松，真正的情绪却常在事情结束以后才抵达。你不急着抢第一句话，更愿意等味道沉下来，再说那句自己真正认同的。', relation: '一个不会催你把话说完的人。', cannotStand: '把你的慢当作冷淡。', tonight: '晚到的甜，也算准时。' },
    FLEA: { name: '情绪延迟到账 · 茶青酥皮型', line: '当时说没事，回家以后才收到通知。', essay: '你处理现场的能力很好，甚至能在混乱里显得格外平静。只是被暂存的感受不会消失，它们会在一个安静时刻重新排队，让你终于知道自己其实在意什么。', relation: '一个允许你隔天再回答的人。', cannotStand: '要求所有情绪当场结算。', tonight: '有些答案，月落以后才会清楚。' },
    FLRI: { name: '低电量社交 · 云白冰皮型', line: '不是不合群，只是今天的电刚好用完。', essay: '你偏爱熟悉和轻省，不想把每一次相处都做成高能表演。状态好的时候你很柔软，电量见底时则更需要边界。你不是退出关系，只是在给自己充电。', relation: '一个不靠高频回复确认关系的人。', cannotStand: '把随时在线当作爱的证明。', tonight: '月亮也不是整夜都最亮。' },
    FLRA: { name: '圆得差不多 · 经典莲蓉型', line: '你不追求惊天动地，更在意日子能不能入口。', essay: '你喜欢可预期的温度，也愿意接受一点不完美。做决定时不爱反复拉扯，觉得能过日子的答案往往比最漂亮的答案更诚实。', relation: '一个说到做到、也不制造额外戏剧的人。', cannotStand: '为了新鲜感，把简单的事弄得很累。', tonight: '不必每次满月，都许一个宏大的愿。' },
  };

  var traitLabels = {
    novelty: ['熟悉半径', '尝鲜半径'],
    control: ['差不多', '每 1% 都要调'],
    emotion: ['清淡', '流心'],
    intuition: ['权衡', '凭感觉'],
    aftertaste: ['当场表达', '后知后觉'],
    boundary: ['容易被带跑', '极度自洽'],
    decorum: ['情绪外露', '礼貌包裹'],
  };

  return {
    archetypes: archetypes,
    blends: blends,
    fates: fates,
    fillings: fillings,
    skins: skins,
    stamps: stamps,
    surprises: surprises,
    traitLabels: traitLabels,
  };
});
