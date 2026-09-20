(function (root, factory) {
  var api = factory();
  root.MoonContent = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var skins = [
    { id: 'snow', name: '云白冰皮', note: '软糯微凉，像刚从冰箱取出', color: '#dedfd8', accent: '#aeb7aa', deltas: { novelty: -22, emotion: 8, decorum: 14 } },
    { id: 'amber', name: '琥珀广式', note: '烤得油亮，边缘有一点焦香', color: '#b96f35', accent: '#71361f', deltas: { novelty: -30, control: 10, boundary: 14 } },
    { id: 'tea', name: '茶青酥皮', note: '层层起酥，茶香落在最后', color: '#879078', accent: '#4d5947', deltas: { novelty: 14, emotion: -10, aftertaste: 20 } },
    { id: 'charcoal', name: '墨黑竹炭', note: '深色薄皮，切面反差很大', color: '#393a37', accent: '#171816', deltas: { novelty: 30, boundary: 20, decorum: -12 } },
  ];

  var fillings = [
    { id: 'lotus', name: '莲蓉', note: '细腻绵密，甜度刚好', color: '#c99c62', deltas: { novelty: -28, emotion: 2, boundary: 12 } },
    { id: 'sesame', name: '黑芝麻', note: '微苦坚果香，越嚼越浓', color: '#34302d', deltas: { emotion: 16, aftertaste: 30, decorum: 14 } },
    { id: 'osmanthus', name: '桂花酒酿', note: '花香轻，酒酿香慢慢上来', color: '#d7aa55', deltas: { novelty: 12, emotion: 28, aftertaste: 24 } },
    { id: 'custard', name: '海盐奶黄', note: '软软的奶香，最后一点咸', color: '#e0b756', deltas: { novelty: 8, emotion: 20, intuition: 12 } },
    { id: 'coffee', name: '冷萃咖啡', note: '咖啡味清楚，收尾不太甜', color: '#70452f', deltas: { novelty: 24, emotion: -8, boundary: 16 } },
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
    NCEI: { name: '清醒发疯·冰美式流心型', line: '你会先看清规则，再走那条有趣的边线', essay: '桌上多了一样陌生食材，你会先问能不能搭，而不是立刻说不行。真要动手，烤箱温度和退路你也都留意着。看着大胆，其实每一步都心里有数。', relation: '一个接得住玩笑，也尊重你认真时刻的人。', cannotStand: '把“为你好”当成万能通行证。', tonight: '月亮可以很圆，做法不必太规矩。' },
    NCEA: { name: '有边界的野心·焦糖咖啡型', line: '你想试新口味，但配方得自己定', essay: '你会买没吃过的月饼，也会认真看配料表。新鲜感对你有吸引力，失控却没有。别人说“都可以”的时候，你通常已经想好最想要的那一口。', relation: '一个不压住你的锋芒，也不会替你收尾的人。', cannotStand: '临时起意以后，把代价留给别人。', tonight: '想走远一点，先把自己的火看稳。' },
    NCRI: { name: '月下失重·酸梅桂花型', line: '你尝鲜很快，回味却很久', essay: '一口酸梅桂花能让你想起某个早就过去的晚上。你愿意往新地方走，也很难把旧味道一下子丢掉。决定做得利落，回头想的时候却会格外细。', relation: '一个允许情绪晚点到、不催你立刻命名的人。', cannotStand: '把复杂感受压成一个标准答案。', tonight: '有些重量，要离地以后才感觉得到。' },
    NCRA: { name: '天生反骨·竹炭海盐型', line: '别人选经典，你先看限量口味', essay: '不是为了和谁不同，你只是想知道旁边那个选项到底怎么样。“大家都这样”对你没什么说服力；给你一个好理由，比叫你照做有效得多。', relation: '一个能讨论、不用服从来证明亲近的人。', cannotStand: '没有理由的规矩和没有内容的共识。', tonight: '月亮被看了很多年，你还是可以换个角度。' },
    NLEI: { name: '随地自洽·酒酿流心型', line: '奇怪的搭配到你手里，也能吃出乐趣', essay: '配方临时变了，你大概会说“先试试看”。不是每次都好吃，但你不怕这一口试错。比起证明自己选对，你更在意有没有真的尝过。', relation: '一个不替你定义正常，也愿意一起试错的人。', cannotStand: '还没开始就被劝回安全区。', tonight: '配方没有正解，吃得下就是一种回答。' },
    NLEA: { name: '浪漫务实·桂花奶黄型', line: '会买花，也记得查末班车', essay: '你愿意为好看的纸盒多停三分钟，回家路上又会把垃圾分类好。浪漫对你不是脱离现实，是把小小的好看放进真实日子里。', relation: '一个会陪你看月亮，也会顺手带伞的人。', cannotStand: '拿现实感当作嘲笑温柔的理由。', tonight: '好看的月色，也可以照进具体生活。' },
    NLRI: { name: '先疯再说·辣条月光型', line: '新品一上架，你已经咬了第一口', essay: '你对喜欢的东西反应很快，犹豫通常追不上你。偶尔踩雷也会笑着讲给朋友听。只是夜深时，那些没看清的细节还是会悄悄回来。', relation: '一个不会扫兴，也敢在必要时拉你一把的人。', cannotStand: '把所有可能性讨论到失去味道。', tonight: '趁月亮还热，先咬一口。' },
    NLRA: { name: '松弛试吃·半块月亮型', line: '圆不圆没关系，好吃就能分朋友一半', essay: '饼皮裂了一点，你不会急着藏起来；夹心偏甜，也可以配一杯茶。你很会给生活留余地，不把一次选择做成一场考试。', relation: '一个不把每次沉默都解释成问题的人。', cannotStand: '为了显得认真，把轻松也做成任务。', tonight: '圆得差不多，就已经可以分享。' },
    FCEI: { name: '礼貌崩溃·海盐莲蓉型', line: '嘴上说都行，心里已经写了三条意见', essay: '聚餐时你会先让大家选，真遇到离谱决定又忍不住把话说清楚。你的礼貌不是没脾气，只是不想让现场太难看。等回到家，才会把那口气慢慢吐出来。', relation: '一个能听懂“没事”有几种意思的人。', cannotStand: '别人嘴上说随便，最后又否掉你的选择。', tonight: '体面可以留，委屈不用全吞。' },
    FCEA: { name: '过分体面·琥珀莲蓉型', line: '连说不喜欢，都说得很周全', essay: '你会把桌面收好，把最后一块月饼分给别人，再处理自己的失望。周全是你的本事，但有时候也让人忘了问你到底想不想要。', relation: '一个不会利用你的周全、愿意主动补位的人。', cannotStand: '把你的克制当成理所当然。', tonight: '有些裂缝不必立刻抹平。' },
    FCRI: { name: '嘴硬心软·黑芝麻型', line: '说着不用，还是偷偷留了半块给他', essay: '你不太会把关心挂在嘴边，提醒人带伞、顺手多买一份倒是很自然。表面像黑芝麻一样沉，咬开以后，甜味来得比你承认得快。', relation: '一个不逼你承认心软，却看得见的人。', cannotStand: '当众拆穿你留好的台阶。', tonight: '回甘晚一点，也还是甜。' },
    FCRA: { name: '稳定内耗·五味回甘型', line: '点单前看完评价，吃完还在想另一款', essay: '你会替每个选择预想后果，做事可靠，却很难真正关掉脑内的比较页。偶尔就选第一眼想吃的那块，味道没那么可控，也未必会差。', relation: '一个能给明确回应、不让你一直猜的人。', cannotStand: '模糊承诺和临时改变标准。', tonight: '不是每一口，都需要写完风险报告。' },
    FLEI: { name: '慢热回甘·桂花酒酿型', line: '第一口没说话，第二口开始喜欢', essay: '你需要一点时间和人、和味道熟起来。热闹散了以后，某个细节才慢慢变清楚。你不是慢半拍，只是不愿抢着给出一个还没尝明白的答案。', relation: '一个不会催你把话说完的人。', cannotStand: '把你的慢当作冷淡。', tonight: '晚到的甜，也算准时。' },
    FLEA: { name: '情绪延迟到账·茶青酥皮型', line: '现场说没事，洗澡时才想起那句话', essay: '忙的时候你能把场面照顾得很好，真正的感受却常常晚一点到。给自己留一段安静的路，不用逼着每件事都在当下结账。', relation: '一个允许你隔天再回答的人。', cannotStand: '要求所有情绪当场结算。', tonight: '有些答案，月落以后才会清楚。' },
    FLRI: { name: '低电量社交·云白冰皮型', line: '聚会喜欢，散场后的安静更喜欢', essay: '你不是不想见人，只是不想每次都拿出满格电量。状态好时你会认真听，累了就想回家吃点简单的。真正亲近的人，不会拿回复速度算关系。', relation: '一个不靠高频回复确认关系的人。', cannotStand: '把随时在线当作爱的证明。', tonight: '月亮也不是整夜都最亮。' },
    FLRA: { name: '圆得差不多·经典莲蓉型', line: '不用惊喜礼盒，老味道就很满足', essay: '你知道什么味道让自己踏实，也不急着向别人证明品位。月饼稍微碎了一角，你会照样切开分着吃。日子能入口，比包装完美更重要。', relation: '一个说到做到、也不制造额外戏剧的人。', cannotStand: '为了新鲜感，把简单的事弄得很累。', tonight: '不必每次满月，都许一个宏大的愿。' },
  };

  var traitLabels = {
    novelty: ['熟悉半径', '尝鲜半径'],
    control: ['差不多', '每1% 都要调'],
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
