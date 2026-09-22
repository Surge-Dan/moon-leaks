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
    { id: 'osmanthus', name: '桂香桃山皮', note: '细细松开，带一点桂花甜香', color: '#d39a4d', accent: '#9b5f26', deltas: { novelty: 8, emotion: 18, aftertaste: 16 } },
    { id: 'purple', name: '紫薯酥皮', note: '外层轻脆，颜色藏得很稳', color: '#74616e', accent: '#4a374b', deltas: { novelty: 22, control: 4, boundary: 12 } },
  ];

  var fillings = [
    { id: 'lotus', asset: 'lotus', name: '莲蓉', note: '细腻绵密，甜度刚好', color: '#c99c62', deltas: { novelty: -28, emotion: 2, boundary: 12 } },
    { id: 'sesame', asset: 'sesame', name: '黑芝麻', note: '微苦坚果香，越嚼越浓', color: '#34302d', deltas: { emotion: 16, aftertaste: 30, decorum: 14 } },
    { id: 'osmanthus', asset: 'osmanthus', name: '桂花酒酿', note: '花香轻，酒酿香慢慢上来', color: '#d7aa55', deltas: { novelty: 12, emotion: 28, aftertaste: 24 } },
    { id: 'custard', asset: 'custard', name: '海盐奶黄', note: '软软的奶香，最后一点咸', color: '#e0b756', deltas: { novelty: 8, emotion: 20, intuition: 12 } },
    { id: 'coffee', asset: 'coffee', name: '冷萃咖啡', note: '咖啡味清楚，收尾不太甜', color: '#70452f', deltas: { novelty: 24, emotion: -8, boundary: 16 } },
    { id: 'chestnut', asset: 'lotus', name: '栗子蓉', note: '温和的坚果香，入口很稳', color: '#ad7848', deltas: { novelty: -4, control: 12, aftertaste: 18 } },
    { id: 'redbean', asset: 'lotus', name: '赤豆沙', note: '豆香厚一点，甜味收得住', color: '#8e4a39', deltas: { emotion: 18, decorum: 14, aftertaste: 12 } },
    { id: 'matcha', asset: 'osmanthus', name: '抹茶流心', note: '茶味清亮，后面有一点苦', color: '#76865f', deltas: { novelty: 26, boundary: 12, intuition: 10 } },
  ];

  var blends = [
    { id: 'yolk-flow', left: '蛋黄', right: '流心', colors: ['#d78b2d', '#f1c76e'], deltas: { emotion: 20, control: 8 } },
    { id: 'cocoa-salt', left: '黑巧', right: '海盐', colors: ['#4c2e25', '#d7d0bd'], deltas: { emotion: 12, boundary: 16 } },
    { id: 'plum-flower', left: '酸梅', right: '桂花', colors: ['#783a45', '#c9993d'], deltas: { novelty: 18, aftertaste: 18 } },
    { id: 'coffee-custard', left: '咖啡', right: '奶黄', colors: ['#68402d', '#e3bd62'], deltas: { novelty: 12, intuition: -8 } },
    { id: 'chestnut-sesame', left: '栗子', right: '黑芝麻', colors: ['#9a633d', '#38302d'], deltas: { control: 12, aftertaste: 22 } },
    { id: 'matcha-redbean', left: '抹茶', right: '赤豆', colors: ['#74855d', '#9b5140'], deltas: { novelty: 22, emotion: 14 } },
  ];

  var surprises = [
    { id: 'truffle-snack', name: '烤香榛子', form: '脆一点，香气也多一点', color: '#8e6240', photo: '19% 28%', deltas: { novelty: 42, boundary: 14, decorum: -18 } },
    { id: 'vinegar', name: '陈皮碎', form: '微苦回甘，留在最后一口', color: '#5a3027', photo: '50% 24%', deltas: { novelty: 24, aftertaste: 28 } },
    { id: 'coriander', name: '桂花蜜', form: '一点花香，不会太甜', color: '#b7893d', photo: '80% 25%', deltas: { novelty: 18, boundary: 30 } },
    { id: 'iced-americano', name: '咸蛋黄', form: '咸香浓一点，刚好压住甜', color: '#d88b27', photo: '35% 53%', deltas: { novelty: 12, emotion: -16, decorum: 12 } },
    { id: 'boss-pie', name: '栗子丁', form: '咬到时有一点颗粒感', color: '#9a6035', photo: '70% 54%', deltas: { novelty: 20, intuition: -18, boundary: -14 } },
    { id: 'read-no-reply', name: '黑芝麻脆', form: '香得很稳，越嚼越浓', color: '#34302d', photo: '50% 24%', deltas: { emotion: 30, aftertaste: 34, decorum: 20 } },
    { id: 'monday-battery', name: '松子仁', form: '轻轻一粒，口感更亮', color: '#d0b47b', photo: '19% 28%', deltas: { emotion: -12, intuition: -10, aftertaste: 18 } },
    { id: 'after-work-air', name: '海盐碎', form: '添一点咸，甜味更清楚', color: '#91a9a2', photo: '35% 53%', deltas: { emotion: 16, intuition: 24, boundary: 12 } },
    { id: 'moon-shard', name: '糯米麻薯', form: '软一点，咬开更有层次', color: '#d7d4bd', photo: '50% 75%', deltas: { novelty: 28, emotion: 22, aftertaste: 16 } },
    { id: 'flower-wind', name: '桂花糖渍', form: '香气很轻，颜色很好看', color: '#c7a34c', photo: '80% 25%', deltas: { emotion: 24, intuition: 20, decorum: 8 } },
    { id: 'late-reunion', name: '红豆沙', form: '绵密一点，像小时候的味道', color: '#9c6d52', photo: '70% 54%', deltas: { emotion: 38, aftertaste: 32 } },
    { id: 'home-countdown', name: '茶香酥粒', form: '收尾干净，带一点茶味', color: '#8a7665', photo: '25% 75%', deltas: { emotion: 26, aftertaste: 28, control: 10 } },
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
    { id: 'full-moon', name: '满月纹', label: '圆满相见', deltas: { emotion: 14, decorum: 10 } },
    { id: 'osmanthus', name: '桂影纹', label: '桂影入怀', deltas: { emotion: 22, aftertaste: 16 } },
    { id: 'cloud', name: '祥云纹', label: '云起有时', deltas: { control: -10, boundary: 12 } },
    { id: 'rabbit', name: '玉兔纹', label: '捣药望月', deltas: { intuition: 18, emotion: 8 } },
    { id: 'ruyi', name: '如意纹', label: '诸事顺意', deltas: { control: 16, decorum: 12 } },
    { id: 'window', name: '菱花窗纹', label: '见月如故', deltas: { aftertaste: 22, boundary: 8 } },
    { id: 'harvest', name: '秋实纹', label: '岁有余庆', deltas: { novelty: 10, intuition: 12 } },
    { id: 'fish', name: '双鱼纹', label: '相逢有信', deltas: { emotion: 18, aftertaste: 20 } },
  ];

  var archetypes = {
    NCEI: { name: '月下试新', line: '会留意边界，也愿意试一口新味道', essay: '你愿意把没见过的食材放上案台，但不会把整块月饼交给运气。好奇心在前，分寸感在后，做事常有自己的章法。', relation: '接得住玩笑，也尊重你认真时刻的人。', cannotStand: '一句“为你好”就替你做决定。', tonight: '月色正好，换一味也无妨。' },
    NCEA: { name: '自定配方', line: '想尝新的，配方得合自己心意', essay: '新鲜感能让你驻足，但你会先看清分量。你不爱随大流，也不喜欢被催着表态；想清楚以后，步子比谁都稳。', relation: '不压住你的锋芒，也不替你收尾的人。', cannotStand: '临时起意，却把麻烦留给旁人。', tonight: '火候在手，慢一点也算向前。' },
    NCRI: { name: '桂影回甘', line: '尝鲜很快，回味总会停得久一点', essay: '你会被新的味道吸引，也记得旧日里某个细小的香气。决定不算拖沓，只是做完以后还愿意再想一想。', relation: '允许情绪晚些抵达的人。', cannotStand: '把复杂心意压成一个答案。', tonight: '月落以后，香气还在。' },
    NCRA: { name: '另开一味', line: '不怕和别人不同，只怕没尝过', essay: '常规选项未必能说服你。你需要一个理由，也愿意听不同的做法；若觉得有趣，就会自己动手试出答案。', relation: '能商量，不把服从当成亲近的人。', cannotStand: '没有来由的规矩。', tonight: '月有万面，何妨换个角度。' },
    NLEI: { name: '随手成味', line: '配方变了，也愿意先尝一口', essay: '临时多了一样食材，你的第一反应常是看看能不能搭。结果未必每次都完美，但你更在意这一口有没有真实的趣味。', relation: '不急着定义对错，愿意一起试的人。', cannotStand: '还没动手就把人劝回原处。', tonight: '先尝过，才知合不合口。' },
    NLEA: { name: '花灯入常', line: '爱好看，也把日子过得很实在', essay: '你会为一盏好看的灯停步，也会记得把手边的事安顿好。浪漫不是摆在高处，而是让寻常日子多一点可看的光。', relation: '会陪你看月亮，也记得带伞的人。', cannotStand: '拿现实感嘲笑温柔。', tonight: '桂香入夜，日子也会发亮。' },
    NLRI: { name: '趁热一口', line: '喜欢的东西出现，就想先试试', essay: '你对有趣的事反应很快，犹豫经常追不上你。偶尔踩雷也不太介意，能把过程讲成一段好玩的见闻。', relation: '不扫兴，也会在必要时提醒你的人。', cannotStand: '把每个可能都讨论到没味道。', tonight: '趁月未凉，先咬一口。' },
    NLRA: { name: '留白成圆', line: '不求处处严丝合缝，合口就好', essay: '饼皮裂一点、夹心偏一点，都不至于坏了兴致。你很会给生活留余地，不把一次选择做成一场必须满分的考试。', relation: '不把每次沉默都当成问题的人。', cannotStand: '把轻松也做成任务。', tonight: '圆得差不多，就可分食。' },
    FCEI: { name: '话留三分', line: '外表周全，心里其实有自己的分寸', essay: '你通常先照顾场面，遇到真正不合适的事还是会说清楚。礼貌不是没有脾气，只是不愿让无关的人承受你的情绪。', relation: '听得懂话里没说完的部分的人。', cannotStand: '嘴上说随意，最后又推翻选择。', tonight: '体面可留，心意不必全藏。' },
    FCEA: { name: '持灯而行', line: '总能顾全别人，也该问问自己', essay: '你会把案台收好，把最后一块月饼让出去，再慢慢处理自己的失望。周全是本事，但不必每次都由你来成全。', relation: '不会利用你的周全，愿意主动补位的人。', cannotStand: '把你的克制当作理所当然。', tonight: '有些心事，留给自己也可。' },
    FCRI: { name: '黑芝麻心', line: '嘴上不多说，关心都在细处', essay: '你不太把在意挂在嘴边，倒会记得提醒人带伞、顺手多留一份。看着沉静，熟悉以后会发现你的心意很甜。', relation: '不逼你表态，却看得见你的人。', cannotStand: '当众拆穿你留好的台阶。', tonight: '回甘晚一点，也还是甜。' },
    FCRA: { name: '细想一会', line: '可靠细致，只是常把选择想得很远', essay: '你会替每个决定预想后果，做事让人放心，却很难关掉脑内的比较。偶尔选第一眼想吃的那块，也未必会错。', relation: '能给清楚回应，不让你一直猜的人。', cannotStand: '模糊承诺和临时改口。', tonight: '月色不问答案，先坐一会。' },
    FLEI: { name: '慢火回甘', line: '第一口安静，第二口才慢慢喜欢', essay: '你需要一点时间和人、和味道熟起来。热闹散了以后，某个细节才变清楚；这不是慢半拍，是愿意把一件事尝明白。', relation: '不催你把话说完的人。', cannotStand: '把你的慢当作冷淡。', tonight: '晚到的甜，也算准时。' },
    FLEA: { name: '月落知心', line: '忙时很稳，感受会在安静处慢慢来', essay: '你能把眼前的场面照顾得很好，真正的感受却常在后来抵达。给自己留一段安静的路，比急着解释更有用。', relation: '允许你隔天再回答的人。', cannotStand: '要求所有心情当场结清。', tonight: '月落之后，答案自会浮现。' },
    FLRI: { name: '低灯小坐', line: '喜欢相聚，也珍惜散场后的安静', essay: '你不是不想见人，只是不想每次都拿出满格电量。状态好时认真听，累了就回家吃点简单的，这也很自在。', relation: '不靠高频回复确认关系的人。', cannotStand: '把随时在线当成心意。', tonight: '月亮也有光暗，不必整夜明亮。' },
    FLRA: { name: '旧味安心', line: '熟悉的味道，已经足够让人踏实', essay: '你知道什么适合自己，也不急着向谁证明品位。月饼碎了一角，照样能切开分着吃；日子能入口，比包装更重要。', relation: '说到做到，也不制造额外波澜的人。', cannotStand: '为了新鲜，把简单的事弄得太累。', tonight: '一盏清茶，便是圆满。' },
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
