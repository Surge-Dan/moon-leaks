(function (root) {
  'use strict';

  var app = document.getElementById('app');
  var toast = document.getElementById('toast');
  var shareCanvas = document.getElementById('share-canvas');
  var Content = root.MoonContent;
  var Engine = root.MoonEngine;
  var Visuals = root.MoonVisuals;
  var STEPS = ['intro', 'skin', 'filling', 'blend', 'surprise', 'fate', 'knead', 'stamp', 'bake', 'reveal', 'result'];
  var PROGRESS_KEY = 'moon-leaks-progress-v1';
  var LAST_RESULT_KEY = 'moon-leaks-last-result';

  function safeRead(key) {
    try {
      var raw = root.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function safeWrite(key, value) {
    try {
      root.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  function safeRemove(key) {
    try { root.localStorage.removeItem(key); } catch (error) { return; }
  }

  function hasValidTraits(traits) {
    return Boolean(traits) && Engine.TRAIT_KEYS.every(function (key) {
      return typeof traits[key] === 'number' && Number.isFinite(traits[key]);
    });
  }

  function hasValidSession(session) {
    return Boolean(session) && typeof session.id === 'string' && hasValidTraits(session.traits) &&
      session.choices && typeof session.choices === 'object' &&
      Array.isArray(session.actions) && Array.isArray(session.signals) && Array.isArray(session.durations);
  }

  function hasKnownId(items, id) {
    return typeof id === 'string' && items.some(function (item) { return item.id === id; });
  }

  function hasValidFate(fate) {
    return Boolean(fate) && ['left', 'right'].every(function (side) {
      return fate[side] && typeof fate[side].label === 'string' && fate[side].deltas && typeof fate[side].deltas === 'object';
    });
  }

  function hasValidModel(model) {
    return Boolean(model) && typeof model.fillingColor === 'string' &&
      Array.isArray(model.blendColors) && model.blendColors.length === 2 &&
      ['bakeLevel', 'ratio', 'emotion', 'boundary', 'control', 'intuition'].every(function (key) {
        return typeof model[key] === 'number' && Number.isFinite(model[key]);
      });
  }

  function hasValidProgress(saved) {
    if (!saved || !hasValidSession(saved.session) || STEPS.indexOf(saved.step) === -1 || saved.step === 'intro' || saved.step === 'result') return false;
    var stepIndex = STEPS.indexOf(saved.step);
    if (typeof saved.fillingIndex !== 'number' || saved.fillingIndex < 0 || saved.fillingIndex >= Content.fillings.length) return false;
    if (typeof saved.blendIndex !== 'number' || saved.blendIndex < 0 || saved.blendIndex >= Content.blends.length) return false;
    if (typeof saved.ratio !== 'number' || saved.ratio < 10 || saved.ratio > 90) return false;
    if (stepIndex >= STEPS.indexOf('filling') && !hasKnownId(Content.skins, saved.skinId)) return false;
    if (stepIndex >= STEPS.indexOf('blend') && !hasKnownId(Content.fillings, saved.fillingId)) return false;
    if (stepIndex >= STEPS.indexOf('surprise')) {
      if (!Array.isArray(saved.surpriseSet) || saved.surpriseSet.length < 1) return false;
      if (!saved.surpriseSet.every(function (item) { return item && hasKnownId(Content.surprises, item.id); })) return false;
    }
    if (saved.step === 'fate' && !hasValidFate(saved.fate)) return false;
    if (saved.fate && !hasValidFate(saved.fate)) return false;
    if (stepIndex >= STEPS.indexOf('knead') && ['caught', 'missed'].indexOf(saved.surpriseOutcome) === -1) return false;
    if (saved.surpriseOutcome === 'caught' && !hasKnownId(Content.surprises, saved.surpriseId)) return false;
    if (stepIndex >= STEPS.indexOf('stamp') && (!Array.isArray(saved.kneadPoints) || typeof saved.kneadProgress !== 'number')) return false;
    if (stepIndex >= STEPS.indexOf('bake') && !hasKnownId(Content.stamps, saved.stampId)) return false;
    if (stepIndex >= STEPS.indexOf('reveal') && (typeof saved.bakeLevel !== 'number' || saved.bakeLevel < 0 || saved.bakeLevel > 100)) return false;
    return true;
  }

  function readValidSavedResult() {
    var saved = safeRead(LAST_RESULT_KEY);
    var result = saved && saved.result;
    var snapshot = saved && saved.snapshot;
    if (!result || !['code', 'name', 'line', 'essay', 'relation', 'cannotStand', 'tonight', 'number'].every(function (key) {
          return typeof result[key] === 'string';
        }) || !hasValidTraits(result.traits) || !hasValidModel(result.model) ||
        !result.skin || typeof result.skin.name !== 'string' ||
        !result.filling || typeof result.filling.name !== 'string' ||
        !result.blend || typeof result.blend.left !== 'string' || typeof result.blend.right !== 'string' ||
        !result.stamp || typeof result.stamp.label !== 'string' ||
        !Array.isArray(result.evidence) || !Array.isArray(result.hiddenPages) ||
        !snapshot || !hasKnownId(Content.skins, snapshot.skinId) ||
        !hasKnownId(Content.fillings, snapshot.fillingId) || !hasKnownId(Content.stamps, snapshot.stampId) ||
        typeof snapshot.blendIndex !== 'number' || snapshot.blendIndex < 0 || snapshot.blendIndex >= Content.blends.length ||
        typeof snapshot.ratio !== 'number' || typeof snapshot.bakeLevel !== 'number' ||
        !((snapshot.fate === null && snapshot.fateChoice === null) ||
          (hasValidFate(snapshot.fate) && ['left', 'right'].indexOf(snapshot.fateChoice) !== -1))) {
      return null;
    }
    result.model.skinId = snapshot.skinId;
    result.model.fillingId = snapshot.fillingId;
    return saved;
  }

  function createInitialState() {
    return {
      session: Engine.createSession('moon-' + Date.now().toString(36)), step: 'intro', stepStartedAt: performance.now(),
      skinId: null, fillingIndex: 0, fillingId: null, blendIndex: 0, ratio: 50, ratioAdjustments: 0,
      surpriseSet: null, surpriseId: null, surpriseOutcome: null, fate: null, fateChoice: null,
      kneadProgress: 0, kneadDistance: 0, kneadAngleTravel: 0, kneadStartedAt: 0, kneadPoints: [],
      stampId: null, stampHoldMs: 0, stampReleases: 0,
      bakeLevel: 28, bakeStartedAt: 0, bakeRaf: 0, cutProgress: 0,
      result: null, resultPage: 0, toastTimer: 0, savedResult: readValidSavedResult(),
    };
  }

  function restoreProgress(base, saved) {
    if (!hasValidProgress(saved)) return base;
    var restored = Object.assign(base, saved);
    restored.stepStartedAt = performance.now();
    restored.bakeStartedAt = 0;
    restored.bakeRaf = 0;
    restored.toastTimer = 0;
    restored.result = null;
    restored.savedResult = readValidSavedResult();
    return restored;
  }

  var state = restoreProgress(createInitialState(), safeRead(PROGRESS_KEY));

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function hashText(value) {
    var hash = 2166136261;
    for (var index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function pickById(items, id) {
    return items.find(function (item) { return item.id === id; });
  }

  function previousStep() {
    if (state.step === 'knead') return state.fate ? 'fate' : 'surprise';
    var index = STEPS.indexOf(state.step);
    return index > 0 && STEPS[index - 1] !== 'result' ? STEPS[index - 1] : null;
  }

  function stepMeta(label, progress, allowBack) {
    var back = allowBack === false ? '' : '<button class="back-action" data-action="back-step" aria-label="返回上一步">‹</button>';
    return '<div class="topline">' + back + '<span class="brand-mark">月下案台</span><span class="step-label">' + escapeHtml(label) + '</span><span class="topline-mark" aria-hidden="true">◌</span></div>' +
      '<div class="progress-line" role="progressbar" aria-label="制作进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + progress + '"><span style="--progress:' + progress + '%"></span></div>';
  }

  function showToast(message) {
    root.clearTimeout(state.toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    state.toastTimer = root.setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 2200);
  }

  function completeDuration(stepName, allowBehaviorSignal) {
    var duration = Math.max(0, performance.now() - state.stepStartedAt);
    var ratio = Engine.getDurationRatio(state.session, duration);
    Engine.recordDuration(state.session, stepName, duration);
    if (allowBehaviorSignal !== false && state.session.durations.length >= 3) {
      if (ratio >= 1.65) {
        Engine.addSignal(state.session, 'behavior', { control: 14, intuition: -10 }, '这一段比你自己的中位节奏慢了 ' + ratio.toFixed(1) + ' 倍', { diagnosticScore: Math.abs(ratio - 1) * 50 });
      } else if (ratio <= 0.58) {
        Engine.addSignal(state.session, 'behavior', { intuition: 16, control: -8 }, '这一段你几乎没犹豫就定了', { diagnosticScore: Math.abs(ratio - 1) * 50 });
      }
    }
    return ratio;
  }

  function goStep(nextStep) {
    if (state.bakeRaf) {
      root.cancelAnimationFrame(state.bakeRaf);
      state.bakeRaf = 0;
    }
    state.step = nextStep;
    state.session.step = nextStep;
    state.stepStartedAt = performance.now();
    state.resultPage = nextStep === 'result' ? 0 : state.resultPage;
    if (nextStep === 'surprise') ensureSurpriseSet();
    if (nextStep === 'result') safeRemove(PROGRESS_KEY);
    else safeWrite(PROGRESS_KEY, Object.assign({}, state, {
      stepStartedAt: 0, bakeStartedAt: 0, bakeRaf: 0, toastTimer: 0,
      result: null, savedResult: null, kneadPoints: state.kneadPoints.slice(-220),
    }));
    render();
  }

  function renderIntro() {
    return '<section class="screen intro-screen">' +
      stepMeta('月下案台', 0, false) +
      '<div class="atelier-intro"><div class="atelier-photo"><img src="./assets/atelier-hero.webp" alt="月光下的中秋烘焙案台"><span class="atelier-seal">月<br>下<br>案</span><span class="atelier-caption">中秋夜 / 一只月饼的开始</span></div>' +
      '<div class="atelier-copy"><p class="eyebrow">月下案台</p><h1 class="screen-title">今晚，做一只月饼</h1><p class="screen-note">选一层饼皮，放进喜欢的馅。剩下的，交给你的手。</p></div></div>' +
      '<div class="atelier-actions"><button class="primary-action intro-action" data-action="start-intro">开始做一只 <span aria-hidden="true">↗</span></button>' +
      (state.savedResult && state.savedResult.result ? '<button class="quiet-action" data-action="open-last">翻开上一轮</button>' : '') + '</div>' +
      '</section>';
  }

  function renderSkin() {
    var cards = Content.skins.map(function (skin, index) {
      var selected = skin.id === state.skinId ? ' is-selected' : '';
      return '<button class="specimen' + selected + '" data-action="pick-skin" data-id="' + skin.id + '" aria-pressed="' + (selected ? 'true' : 'false') + '">' +
        '<span class="specimen-swatch skin-swatch skin-' + skin.id + '" style="--color:' + skin.color + ';--accent:' + skin.accent + '"></span>' +
        '<span class="specimen-index">0' + (index + 1) + '</span><h3>' + skin.name + '</h3><p>' + skin.note + '</p></button>';
    }).join('');
    return '<section class="screen">' + stepMeta('01 / 选饼皮', 13) +
      '<div class="screen-copy"><p class="eyebrow">先选外面这一层</p><h1 class="screen-title">要不先挑一层饼皮？</h1><p class="screen-note">轻点看纹理，长按看看它的手感</p></div>' +
      '<div class="stage"><div class="specimen-grid">' + cards + '</div></div>' +
      '<button class="primary-action" data-action="confirm-skin" ' + (state.skinId ? '' : 'disabled') + '>选好了，放主馅</button>' +
      '</section>';
  }

  function renderFilling() {
    var filling = Content.fillings[state.fillingIndex];
    var dots = Content.fillings.map(function (_, index) {
      return '<span class="' + (index === state.fillingIndex ? 'is-active' : '') + '"></span>';
    }).join('');
    return '<section class="screen">' + stepMeta('02 / 放主馅', 25) +
      '<div class="screen-copy"><p class="eyebrow">打开馅料匣</p><h1 class="screen-title">原来你喜欢' + filling.name + '呢～</h1><p class="screen-note">左右翻一翻，找一口最想留在里面的</p></div>' +
      '<div class="stage"><div class="booklet" data-role="filling-booklet"><button class="booklet-arrow" data-action="prev-filling" aria-label="上一个主馅">←</button>' +
      '<article class="ingredient-leaf"><span class="specimen-index">主馅0' + (state.fillingIndex + 1) + '/0' + Content.fillings.length + '</span><img class="ingredient-photo" src="./assets/filling-' + filling.id + '.webp" alt=""><h3>' + filling.name + '</h3><p>' + filling.note + '</p><div class="page-dots">' + dots + '</div></article>' +
      '<button class="booklet-arrow" data-action="next-filling" aria-label="下一个主馅">→</button></div></div>' +
      '<button class="primary-action" data-action="confirm-filling">就放' + filling.name + '</button>' +
      '</section>';
  }

  function renderBlend() {
    var blend = Content.blends[state.blendIndex];
    var tabs = Content.blends.map(function (item, index) {
      return '<button class="blend-tab ' + (index === state.blendIndex ? 'is-selected' : '') + '" data-action="select-blend" data-index="' + index + '">' + item.left + ' × ' + item.right + '</button>';
    }).join('');
    return '<section class="screen">' + stepMeta('03 / 调夹心', 38) +
      '<div class="screen-copy"><p class="eyebrow">两种味道配在一起</p><h1 class="screen-title">这一口，想偏向哪边？</h1><p class="screen-note">拖动月饼剖面里的分界线，调到你觉得刚刚好</p></div>' +
      '<div class="stage"><div class="blend-layout"><div class="blend-tabs">' + tabs + '</div>' +
      '<div class="blend-orb" data-role="blend-orb" style="--ratio:' + state.ratio + '%;--blend-left:' + blend.colors[0] + ';--blend-right:' + blend.colors[1] + '"><img class="blend-photo" src="./assets/mooncake-cut-' + (state.fillingId || 'lotus') + '.webp" alt="月饼剖面参考图">' +
      '<span class="blend-half left"></span><span class="blend-half right"></span><span class="blend-seam"></span></div>' +
      '<div class="ratio-readout"><span data-role="ratio-left">' + state.ratio + '</span> : <span data-role="ratio-right">' + (100 - state.ratio) + '</span></div>' +
      '<input class="ratio-range" data-role="ratio-range" aria-label="夹心比例" type="range" min="10" max="90" value="' + state.ratio + '"></div></div>' +
      '<button class="primary-action" data-action="confirm-blend">比例刚刚好</button></section>';
  }

  function ensureSurpriseSet() {
    if (state.surpriseSet) return;
    var pool = Content.surprises.slice();
    var seed = hashText(state.session.id);
    var chosen = [];
    while (chosen.length < 3 && pool.length) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      chosen.push(pool.splice(seed % pool.length, 1)[0]);
    }
    state.surpriseSet = chosen;
  }

  function renderSurprise() {
    ensureSurpriseSet();
    var choices = state.surpriseSet.map(function (item, index) {
      var caught = state.surpriseId === item.id && state.surpriseOutcome === 'caught';
      return '<button class="falling-choice ' + (caught ? 'is-caught' : '') + '" data-action="catch-surprise" data-id="' + item.id + '" ' + (state.surpriseOutcome ? 'disabled' : '') + '>' +
        '<span class="falling-index">0' + (index + 1) + '</span>' +
        '<span class="falling-object" style="--object-color:' + item.color + ';--delay:-' + (index * 1.1) + 's"></span>' +
        '<span class="falling-label"><strong>' + item.name + '</strong><small>' + item.form + '</small></span></button>';
    }).join('');
    var settled = Boolean(state.surpriseOutcome);
    return '<section class="screen atelier-step">' + stepMeta('04 / 加点意外', 50) +
      '<div class="screen-copy"><p class="eyebrow">案台边有点动静</p><h1 class="screen-title">有三样东西掉下来了</h1><p class="screen-note">接住一个，或让它们落在桌边</p></div>' +
      '<div class="stage surprise-stage">' + choices + '</div>' +
      (settled ? '<button class="primary-action" data-action="confirm-surprise">继续做月饼</button>' : '<button class="quiet-action" data-action="dodge-surprise">都不要</button>') +
      '</section>';
  }

  function renderFate() {
    var fate = state.fate;
    return '<section class="screen">' + stepMeta('加料 / 二选一', 56) +
      '<div class="screen-copy"><p class="eyebrow">案台上只留一件</p><h1 class="screen-title">如果只能留一个，你会选哪样？</h1><p class="screen-note">不用解释，凭第一反应就好</p></div>' +
      '<div class="stage"><div class="fate-stage"><button class="fate-choice" data-action="choose-fate" data-side="left">' + fate.left.label + '</button>' +
      '<button class="fate-choice" data-action="choose-fate" data-side="right">' + fate.right.label + '</button></div></div>' +
      '</section>';
  }

  function renderKnead() {
    return '<section class="screen">' + stepMeta('05 / 揉面团', 63) +
      '<div class="screen-copy"><p class="eyebrow">把散开的东西揉到一起</p><h1 class="screen-title">要不要再揉两圈？</h1><p class="screen-note">在案台上的面团上画圈，手感会告诉你什么时候刚好</p></div>' +
      '<div class="stage"><div class="knead-board" data-role="knead-board" role="button" tabindex="0" aria-label="画圈揉月，按回车也可完成"><canvas id="knead-canvas" class="knead-canvas"></canvas></div></div>' +
      '<div class="knead-meter" style="--meter:' + Math.round(state.kneadProgress * 100) + '%"><span></span></div>' +
      '<button class="primary-action" data-action="confirm-knead" ' + (state.kneadProgress >= 0.66 ? '' : 'disabled') + '>面团揉好了</button></section>';
  }

  function renderStamp() {
    var choices = Content.stamps.map(function (stamp) {
      var selected = state.stampId === stamp.id;
      return '<button class="stamp-choice ' + (selected ? 'is-selected' : '') + '" data-action="pick-stamp" data-id="' + stamp.id + '"><b>' + stamp.mark + '</b><small>' + stamp.label + '</small></button>';
    }).join('');
    var current = pickById(Content.stamps, state.stampId) || Content.stamps[0];
    var depth = clamp(state.stampHoldMs / 1600, 0, 1);
    return '<section class="screen">' + stepMeta('06 / 压花纹', 75) +
      '<div class="screen-copy"><p class="eyebrow">轮到模具留下记号</p><h1 class="screen-title">挑一个花纹，压进去</h1><p class="screen-note">选好后按住模具，等花纹慢慢显出来</p></div>' +
      '<div class="stage" style="flex-direction:column"><div class="stamp-list">' + choices + '</div>' +
      '<button class="press-pad" data-action="press-stamp" aria-label="长按压模"><span class="press-mark" style="--mark-opacity:' + (0.18 + depth * 0.62).toFixed(2) + '">' + current.mark + '</span></button></div>' +
      '<div class="press-meter" style="--meter:' + Math.round(depth * 100) + '%"><span></span></div>' +
      '<button class="primary-action" data-action="confirm-stamp" ' + (state.stampId && state.stampHoldMs >= 700 ? '' : 'disabled') + '>花纹压好了</button></section>';
  }

  function bakeLabel(level) {
    if (level < 43) return '月白·还没有醒';
    if (level < 64) return '浅金·刚刚开始';
    if (level < 84) return '焦糖·正好有人喜欢';
    if (level < 94) return '深焦·边界正在靠近';
    return '微焦·玉兔开始敲桌子';
  }

  function renderBake() {
    return '<section class="screen night-step">' + stepMeta('07 / 烘烤', 88) +
      '<div class="screen-copy"><p class="eyebrow">夜里的烤箱</p><h1 class="screen-title">烤到你喜欢的颜色</h1><p class="screen-note">月光在窗外，火候在你手里</p></div>' +
      '<div class="stage oven-stage"><img class="moon-phase-strip" src="./assets/moon-phases.webp" alt="月相变化"><span class="oven-halo"></span><canvas id="bake-canvas" class="mooncake-canvas"></canvas><p class="bake-label" data-role="bake-label">' + bakeLabel(state.bakeLevel) + '</p></div>' +
      '<div class="bake-meter" style="--meter:' + state.bakeLevel + '%"><span></span></div>' +
      '<button class="primary-action" data-action="take-moon">现在出炉</button></section>';
  }

  function renderReveal() {
    return '<section class="screen night-step">' + stepMeta('最后 / 切开', 96) +
      '<div class="screen-copy"><p class="eyebrow">月光照到案板上</p><h1 class="screen-title">这一刀，交给你</h1><p class="screen-note">沿着月弧横向划过，看看里面藏了什么</p></div>' +
      '<div class="stage reveal-stage" data-role="reveal-stage" role="button" aria-label="横向划开月饼"><canvas id="reveal-canvas" class="mooncake-canvas"></canvas>' +
      '<div class="knife-track" aria-hidden="true" style="--cut:' + Math.round(state.cutProgress * 100) + '%"><span class="knife-track-line"></span><span class="knife-handle">✦</span></div>' +
      '<div class="cut-guide">沿着这条线划过去</div></div>' +
      '<button class="quiet-action cut-fallback" data-action="cut-now">直接切开月饼 →</button>' +
      '</section>';
  }

  function buildResult() {
    var traits = Engine.scoreSession(state.session);
    var code = Engine.classifyTraits(traits);
    var archetype = Content.archetypes[code] || Content.archetypes.FLRA;
    var skin = pickById(Content.skins, state.skinId) || Content.skins[0];
    var filling = pickById(Content.fillings, state.fillingId) || Content.fillings[0];
    var blend = Content.blends[state.blendIndex];
    var surprise = pickById(Content.surprises, state.surpriseId);
    var stamp = pickById(Content.stamps, state.stampId) || Content.stamps[0];
    var hiddenPages = Engine.getHiddenPages({ ratioAdjustments: state.ratioAdjustments, bakeLevel: state.bakeLevel });
    var evidence = Engine.selectEvidence(state.session, 5);
    var fallbacks = [
      '你给月亮选了“' + skin.name + '”，第一层先从自己熟悉的触感开始。',
      '夹心最后停在 ' + state.ratio + ':' + (100 - state.ratio) + '，一共调整了 ' + state.ratioAdjustments + ' 次。',
      surprise ? '意外掉下来时，你留下了“' + surprise.name + '”。' : '意外掉下来时，你决定什么都不接。',
      '火候走到 ' + Math.round(state.bakeLevel) + '%，你才把月亮取出来。',
    ];
    fallbacks.forEach(function (item) {
      if (evidence.length < 5 && evidence.indexOf(item) === -1) evidence.push(item);
    });
    state.result = {
      code: code,
      name: archetype.name,
      line: archetype.line,
      essay: archetype.essay,
      relation: archetype.relation,
      cannotStand: archetype.cannotStand,
      tonight: archetype.tonight,
      number: String((hashText(state.session.id) % 99) + 1).padStart(2, '0'),
      traits: traits,
      skin: skin,
      filling: filling,
      blend: blend,
      surprise: surprise,
      stamp: stamp,
      evidence: evidence,
      hiddenPages: hiddenPages,
      model: {
        bakeLevel: state.bakeLevel,
        skinId: state.skinId,
        fillingId: state.fillingId,
        fillingColor: filling.color,
        blendColors: blend.colors,
        ratio: state.ratio,
        emotion: traits.emotion,
        boundary: traits.boundary,
        control: traits.control,
        intuition: traits.intuition,
      },
    };
  }

  function anatomyPage(result) {
    return '<article class="result-page anatomy"><p class="eyebrow">切面01</p><h2 class="screen-title">里面装了什么</h2>' +
      '<canvas id="anatomy-canvas" class="result-canvas"></canvas>' +
      '<div class="anatomy-metrics">' +
      '<div class="anatomy-label one"><b>情绪 ' + result.traits.emotion + '%</b>更容易把感受放进馅里</div>' +
      '<div class="anatomy-label two"><b>掌控 ' + result.traits.control + '%</b>想把比例调得多准</div>' +
      '<div class="anatomy-label three"><b>焦边 ' + Math.max(0, Math.round(state.bakeLevel - 74)) + '%</b>多等了几分火候</div>' +
      '<div class="anatomy-label four"><b>边界 ' + result.traits.boundary + '%</b>面对意外时有多坚定</div></div></article>';
  }

  function evidencePage(result) {
    return '<article class="result-page"><p class="eyebrow">切面02</p><h2 class="screen-title">为什么是这个结果</h2><p class="screen-note">我们记下的是你的选择和操作，不是食材的随机掉落</p>' +
      '<ol class="evidence-list">' + result.evidence.map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('') + '</ol></article>';
  }

  function recipePage(result) {
    var surpriseName = result.surprise ? result.surprise.name : '什么都没接';
    var fateName = state.fateChoice ? state.fate[state.fateChoice].label : '今晚没有分岔';
    return '<article class="result-page"><p class="eyebrow">切面03</p><h2 class="screen-title">这一只的配方</h2><div class="recipe-list">' +
      '<div class="recipe-row"><span>月皮</span><strong>' + result.skin.name + '</strong></div>' +
      '<div class="recipe-row"><span>主馅</span><strong>' + result.filling.name + '</strong></div>' +
      '<div class="recipe-row"><span>夹心</span><strong>' + result.blend.left + state.ratio + '%·' + result.blend.right + (100 - state.ratio) + '%</strong></div>' +
      '<div class="recipe-row"><span>意外</span><strong>' + surpriseName + '</strong></div>' +
      '<div class="recipe-row"><span>分岔</span><strong>' + fateName + '</strong></div>' +
      '<div class="recipe-row"><span>月纹</span><strong>' + result.stamp.label + '</strong></div>' +
      '<div class="recipe-row"><span>火候</span><strong>' + bakeLabel(state.bakeLevel).split('·')[0] + '</strong></div></div></article>';
  }

  function relationshipPage(result) {
    return '<article class="result-page"><p class="eyebrow">切面04</p><h2 class="screen-title">和谁一起吃</h2>' +
      '<div class="relationship-block"><h3>适合和谁一起吃月饼</h3><p>' + result.relation + '</p></div>' +
      '<div class="relationship-block"><h3>你最受不了什么</h3><p>' + result.cannotStand + '</p></div>' +
      '<div class="relationship-block"><h3>今晚的一句话</h3><p>' + result.tonight + '</p></div>' +
      '<p class="essay">' + result.essay + '</p></article>';
  }

  function hiddenPage(type, pageNumber) {
    if (type === 'indecision') {
      return '<article class="result-page hidden-page"><p class="eyebrow">隐藏切面 ' + pageNumber + '</p><h2>比例调了又调</h2><p>你把夹心来回推了' + state.ratioAdjustments + '次。不是选不出来，是两边你都想尝一口。</p></article>';
    }
    return '<article class="result-page hidden-page"><p class="eyebrow">隐藏切面 ' + pageNumber + '</p><h2>你多烤了一会儿</h2><p>颜色已经够深了，你还是想亲眼看看再等几秒会怎样。这一口带一点焦边，也带一点冒险。</p></article>';
  }

  function getResultPages() {
    var result = state.result;
    var pages = [
      '<article class="result-page result-hero"><p class="result-kicker">你的月饼人格·第' + result.number + '轮</p><canvas id="result-hero-canvas" class="result-canvas"></canvas><p class="result-recipe">' + escapeHtml(result.skin.name) + '·' + escapeHtml(result.filling.name) + '</p><h1 class="result-name">' + result.name + '</h1><p class="result-line">' + result.line + '</p><div class="result-actions"><button data-action="open-share">生成结果图</button><button data-action="save-result">留在本机</button></div></article>',
      anatomyPage(result),
      evidencePage(result),
      recipePage(result),
      relationshipPage(result),
    ];
    result.hiddenPages.forEach(function (type, index) {
      pages.push(hiddenPage(type, String(index + 1).padStart(2, '0')));
    });
    return pages;
  }

  function renderResult() {
    if (!state.result) buildResult();
    var pages = getResultPages();
    state.resultPage = clamp(state.resultPage, 0, pages.length - 1);
    return '<section class="screen result-screen">' + stepMeta('结果 / ' + String(state.resultPage + 1).padStart(2, '0'), 100) +
      '<div class="result-book">' + pages[state.resultPage] + '</div>' +
      '<nav class="book-nav" aria-label="结果册翻页"><button class="round-action" data-action="prev-result" aria-label="上一页" ' + (state.resultPage === 0 ? 'disabled' : '') + '>←</button>' +
      '<span class="book-count">' + String(state.resultPage + 1).padStart(2, '0') + '/' + String(pages.length).padStart(2, '0') + (state.resultPage === 0 ? '·往后翻看配方' : '') + '</span>' +
      '<button class="round-action" data-action="next-result" aria-label="下一页" ' + (state.resultPage === pages.length - 1 ? 'disabled' : '') + '>→</button></nav>' +
      (state.resultPage === pages.length - 1 ? '<button class="quiet-action" data-action="restart">再做一轮月亮</button>' : '') +
      '</section>';
  }

  function render() {
    if (STEPS.indexOf(state.step) === -1) state.step = 'intro';
    var views = {
      intro: renderIntro,
      skin: renderSkin,
      filling: renderFilling,
      blend: renderBlend,
      surprise: renderSurprise,
      fate: renderFate,
      knead: renderKnead,
      stamp: renderStamp,
      bake: renderBake,
      reveal: renderReveal,
      result: renderResult,
    };
    app.innerHTML = views[state.step]();
    setupCurrentStep();
  }

  function setupIntro() {
    var button = app.querySelector('[data-action="start-intro"]');
    button.addEventListener('click', function () {
      button.disabled = true;
      completeDuration('intro');
      goStep('skin');
    });
  }

  function setupSkin() {
    app.querySelectorAll('.specimen').forEach(function (specimen) {
      var timer = 0;
      specimen.addEventListener('pointerdown', function () {
        timer = root.setTimeout(function () { specimen.classList.add('is-observing'); }, 420);
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (eventName) {
        specimen.addEventListener(eventName, function () {
          root.clearTimeout(timer);
          root.setTimeout(function () { specimen.classList.remove('is-observing'); }, 260);
        });
      });
    });
  }

  function updateRatio(value) {
    var next = clamp(Math.round(Number(value) || 50), 10, 90);
    if (next !== state.ratio) state.ratioAdjustments += 1;
    state.ratio = next;
    var orb = app.querySelector('[data-role="blend-orb"]');
    var left = app.querySelector('[data-role="ratio-left"]');
    var right = app.querySelector('[data-role="ratio-right"]');
    var range = app.querySelector('[data-role="ratio-range"]');
    if (orb) orb.style.setProperty('--ratio', next + '%');
    if (left) left.textContent = next;
    if (right) right.textContent = 100 - next;
    if (range && Number(range.value) !== next) range.value = next;
  }

  function setupBlend() {
    var range = app.querySelector('[data-role="ratio-range"]');
    var orb = app.querySelector('[data-role="blend-orb"]');
    range.addEventListener('input', function (event) { updateRatio(event.target.value); });
    function setFromPointer(event) {
      var rect = orb.getBoundingClientRect();
      updateRatio(((event.clientX - rect.left) / rect.width) * 100);
    }
    orb.addEventListener('pointerdown', function (event) {
      orb.setPointerCapture(event.pointerId);
      setFromPointer(event);
    });
    orb.addEventListener('pointermove', function (event) {
      if (orb.hasPointerCapture(event.pointerId)) setFromPointer(event);
    });
  }

  function setupKnead() {
    var canvas = document.getElementById('knead-canvas');
    var board = app.querySelector('[data-role="knead-board"]');
    var rect = board.getBoundingClientRect();
    var ratio = Math.min(root.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    var ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    var width = rect.width;
    for (var index = 0; index < 18; index += 1) {
      var angle = (Math.PI * 2 * index) / 18;
      var radius = width * (.25 + ((index * 17) % 10) / 100);
      var x = width / 2 + Math.cos(angle) * radius;
      var y = width / 2 + Math.sin(angle) * radius;
      ctx.fillStyle = index % 3 === 0 ? '#9b512f' : index % 3 === 1 ? '#d9b977' : '#78836d';
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillRect(-6, -3, 12, 6);
      ctx.restore();
    }
    var active = false;
    var previous = null;
    var previousAngle = null;
    function updateKneadMeter() {
      var meter = app.querySelector('.knead-meter');
      meter.style.setProperty('--meter', Math.round(state.kneadProgress * 100) + '%');
      var button = app.querySelector('[data-action="confirm-knead"]');
      if (state.kneadProgress >= .66) button.disabled = false;
    }
    board.addEventListener('pointerdown', function (event) {
      rect = board.getBoundingClientRect();
      active = true;
      previous = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      previousAngle = Math.atan2(previous.y - rect.height / 2, previous.x - rect.width / 2);
      if (!state.kneadStartedAt) state.kneadStartedAt = performance.now();
      board.setPointerCapture(event.pointerId);
    });
    board.addEventListener('pointermove', function (event) {
      if (!active) return;
      rect = board.getBoundingClientRect();
      var point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      var distance = Math.hypot(point.x - previous.x, point.y - previous.y);
      state.kneadDistance += distance;
      var angle = Math.atan2(point.y - rect.height / 2, point.x - rect.width / 2);
      var angleDelta = angle - previousAngle;
      if (angleDelta > Math.PI) angleDelta -= Math.PI * 2;
      if (angleDelta < -Math.PI) angleDelta += Math.PI * 2;
      state.kneadAngleTravel += Math.abs(angleDelta);
      previousAngle = angle;
      state.kneadPoints.push(point);
      if (state.kneadPoints.length > 220) state.kneadPoints.shift();
      state.kneadProgress = clamp(state.kneadAngleTravel / (Math.PI * 6), 0, 1);
      ctx.strokeStyle = 'rgba(232,223,200,.42)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(previous.x, previous.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      previous = point;
      updateKneadMeter();
    });
    function end() { active = false; previous = null; previousAngle = null; }
    board.addEventListener('pointerup', end);
    board.addEventListener('pointercancel', end);
    board.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      if (!state.kneadStartedAt) state.kneadStartedAt = performance.now();
      state.kneadAngleTravel = Math.PI * 6;
      state.kneadProgress = 1;
      state.kneadPoints = [];
      for (var pointIndex = 0; pointIndex < 48; pointIndex += 1) {
        var pointAngle = Math.PI * 2 * pointIndex / 48;
        state.kneadPoints.push({ x: width / 2 + Math.cos(pointAngle) * width * .31, y: rect.height / 2 + Math.sin(pointAngle) * width * .31 });
      }
      updateKneadMeter();
    });
  }

  function setupStamp() {
    var pad = app.querySelector('.press-pad');
    var meter = app.querySelector('.press-meter');
    var button = app.querySelector('[data-action="confirm-stamp"]');
    if (!pad) return;
    var started = 0;
    var raf = 0;
    function tick() {
      if (!started) return;
      var elapsed = performance.now() - started;
      var total = Math.max(state.stampHoldMs, elapsed);
      var depth = clamp(total / 1600, 0, 1);
      meter.style.setProperty('--meter', Math.round(depth * 100) + '%');
      var mark = pad.querySelector('.press-mark');
      mark.style.setProperty('--mark-opacity', (0.18 + depth * .62).toFixed(2));
      raf = root.requestAnimationFrame(tick);
    }
    function endPress() {
      if (!started) return;
      state.stampHoldMs = Math.max(state.stampHoldMs, performance.now() - started);
      state.stampReleases += 1;
      started = 0;
      root.cancelAnimationFrame(raf);
      pad.classList.remove('is-pressing');
      if (state.stampId && state.stampHoldMs >= 700) {
        button.disabled = false;
      } else if (!state.stampId) {
        showToast('先选一个月纹。');
      } else {
        showToast('再按久一点，花纹还没留下。');
      }
    }
    pad.addEventListener('pointerdown', function (event) {
      if (!state.stampId) {
        showToast('先选一个月纹。');
        return;
      }
      pad.setPointerCapture(event.pointerId);
      started = performance.now();
      pad.classList.add('is-pressing');
      tick();
    });
    pad.addEventListener('pointerup', endPress);
    pad.addEventListener('pointercancel', endPress);
    pad.addEventListener('keydown', function (event) {
      if ((event.key === 'Enter' || event.key === ' ') && state.stampId) {
        event.preventDefault();
        state.stampHoldMs = Math.max(state.stampHoldMs, 900);
        state.stampReleases += 1;
        meter.style.setProperty('--meter', '56%');
        button.disabled = false;
      }
    });
  }

  function resultModel() {
    var filling = pickById(Content.fillings, state.fillingId) || Content.fillings[0];
    var blend = Content.blends[state.blendIndex];
    var traits = state.result ? state.result.traits : state.session.traits;
    return {
      bakeLevel: state.bakeLevel, skinId: state.skinId, fillingId: state.fillingId, fillingColor: filling.color, blendColors: blend.colors, ratio: state.ratio,
      emotion: traits.emotion, boundary: traits.boundary, control: traits.control, intuition: traits.intuition,
    };
  }

  function setupBake() {
    var canvas = document.getElementById('bake-canvas');
    var label = app.querySelector('[data-role="bake-label"]');
    var meter = app.querySelector('.bake-meter');
    state.bakeStartedAt = performance.now();
    function tick(now) {
      state.bakeLevel = clamp(28 + (now - state.bakeStartedAt) / 105, 28, 100);
      label.textContent = bakeLabel(state.bakeLevel);
      meter.style.setProperty('--meter', state.bakeLevel.toFixed(1) + '%');
      Visuals.drawMooncake(canvas, resultModel(), 0);
      if (state.bakeLevel < 100) state.bakeRaf = root.requestAnimationFrame(tick);
    }
    state.bakeRaf = root.requestAnimationFrame(tick);
  }

  function setupReveal() {
    var canvas = document.getElementById('reveal-canvas');
    var stage = app.querySelector('[data-role="reveal-stage"]');
    var guide = app.querySelector('.knife-track');
    var fallback = app.querySelector('[data-action="cut-now"]');
    var active = false;
    var startX = 0;
    var pointerId = null;
    var direction = 1;
    var requiredTravel = 0;
    var completed = false;
    Visuals.drawMooncake(canvas, resultModel(), state.cutProgress);
    function finishCut() {
      if (completed) return;
      completed = true;
      active = false;
      pointerId = null;
      state.cutProgress = 1;
      guide.style.setProperty('--cut', '100%');
      stage.classList.add('is-cut');
      fallback.disabled = true;
      Visuals.drawMooncake(canvas, resultModel(), 1);
      completeDuration('reveal', false);
      root.setTimeout(function () { goStep('result'); }, 650);
    }
    function update(event) {
      if (!active || completed || event.pointerId !== pointerId) return;
      if (event.cancelable) event.preventDefault();
      var travel = (event.clientX - startX) * direction;
      state.cutProgress = clamp(travel / requiredTravel, 0, 1);
      guide.style.setProperty('--cut', Math.round(state.cutProgress * 100) + '%');
      Visuals.drawMooncake(canvas, resultModel(), state.cutProgress);
      if (state.cutProgress >= .92) finishCut();
    }
    stage.addEventListener('pointerdown', function (event) {
      if (completed || active || !event.isPrimary) return;
      var cake = canvas.getBoundingClientRect();
      var startedInsideCake = event.clientY >= cake.top + cake.height * .18 &&
        event.clientY <= cake.bottom - cake.height * .18 &&
        event.clientX >= cake.left + cake.width * .08 &&
        event.clientX <= cake.right - cake.width * .08;
      if (!startedInsideCake) return;
      active = true;
      startX = event.clientX;
      pointerId = event.pointerId;
      direction = startX > cake.left + cake.width * .5 ? -1 : 1;
      guide.classList.toggle('is-reverse', direction < 0);
      var available = direction > 0 ? cake.right - startX : startX - cake.left;
      requiredTravel = Math.max(72, Math.min(cake.width * .52, available * .78));
      stage.setPointerCapture(event.pointerId);
    });
    stage.addEventListener('pointermove', update);
    stage.addEventListener('pointerup', function (event) {
      if (event.pointerId !== pointerId) return;
      if (active) update(event);
      active = false;
      pointerId = null;
      if (!completed) {
        state.cutProgress = 0;
        guide.style.setProperty('--cut', '0%');
        Visuals.drawMooncake(canvas, resultModel(), 0);
      }
    });
    stage.addEventListener('pointercancel', function (event) {
      if (event.pointerId !== pointerId) return;
      active = false;
      pointerId = null;
      if (!completed) {
        state.cutProgress = 0;
        guide.style.setProperty('--cut', '0%');
        Visuals.drawMooncake(canvas, resultModel(), 0);
      }
    });
    stage.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        finishCut();
      }
    });
    fallback.addEventListener('click', finishCut);
    stage.tabIndex = 0;
  }

  function setupResult() {
    var hero = document.getElementById('result-hero-canvas');
    var anatomy = document.getElementById('anatomy-canvas');
    if (hero) Visuals.drawMooncake(hero, state.result.model, 1);
    if (anatomy) Visuals.drawMooncake(anatomy, state.result.model, 1);
  }

  function setupCurrentStep() {
    var setups = {
      intro: setupIntro,
      skin: setupSkin,
      blend: setupBlend,
      knead: setupKnead,
      stamp: setupStamp,
      bake: setupBake,
      reveal: setupReveal,
      result: setupResult,
    };
    if (setups[state.step]) setups[state.step]();
  }

  function chooseSkin(id) {
    state.skinId = id;
    render();
  }

  function confirmSkin() {
    var skin = pickById(Content.skins, state.skinId);
    if (!skin) return;
    completeDuration('skin');
    state.session.choices.skin = skin.id;
    Engine.addSignal(state.session, 'choice', skin.deltas, '你先选了“' + skin.name + '”做外壳');
    goStep('filling');
  }

  function turnFilling(direction) {
    var count = Content.fillings.length;
    state.fillingIndex = (state.fillingIndex + direction + count) % count;
    render();
  }

  function confirmFilling() {
    var filling = Content.fillings[state.fillingIndex];
    completeDuration('filling');
    state.fillingId = filling.id;
    state.session.choices.filling = filling.id;
    Engine.addSignal(state.session, 'choice', filling.deltas, '你把“' + filling.name + '”放在了最里面');
    goStep('blend');
  }

  function confirmBlend() {
    var blend = Content.blends[state.blendIndex];
    completeDuration('blend');
    state.session.choices.blend = blend.id;
    state.session.choices.ratio = state.ratio;
    var direction = (state.ratio - 50) / 40;
    var deltas = Object.assign({}, blend.deltas, {
      control: clamp((state.ratioAdjustments - 3) * 6 + Math.abs(direction) * 12, -24, 38),
      emotion: clamp((50 - state.ratio) / 2, -20, 20),
    });
    Engine.addSignal(state.session, 'choice', deltas, '夹心最后停在 ' + state.ratio + ':' + (100 - state.ratio));
    Engine.addSignal(state.session, 'behavior', { control: clamp(state.ratioAdjustments * 4 - 10, -18, 38) }, '你来回调整了 ' + state.ratioAdjustments + ' 次比例');
    goStep('surprise');
  }

  function catchSurprise(id) {
    if (state.surpriseOutcome) return;
    state.surpriseId = id;
    state.surpriseOutcome = 'caught';
    render();
  }

  function dodgeSurprise() {
    if (state.surpriseOutcome) return;
    state.surpriseId = null;
    state.surpriseOutcome = 'missed';
    render();
  }

  function confirmSurprise() {
    var ingredient = pickById(Content.surprises, state.surpriseId);
    var hesitationRatio = completeDuration('surprise');
    Engine.recordSurprise(state.session, ingredient, state.surpriseOutcome, { hesitationRatio: hesitationRatio });
    if (state.surpriseOutcome === 'missed') {
      Engine.addSignal(state.session, 'behavior', { novelty: -18, boundary: 22, control: 12 }, '三个意外掉下来，你一个都没接');
    }
    var seed = hashText(state.session.id + String(state.ratioAdjustments));
    if (seed % 4 === 0) {
      state.fate = Content.fates[Engine.pickFateIndex(seed, Content.fates.length)];
      goStep('fate');
    } else {
      goStep('knead');
    }
  }

  function chooseFate(side) {
    if (!state.fate || !state.fate[side]) return;
    state.fateChoice = side;
    completeDuration('fate');
    Engine.addSignal(state.session, 'fate', state.fate[side].deltas, '分岔出现时，你留下了“' + state.fate[side].label + '”');
    goStep('knead');
  }

  function confirmKnead() {
    if (state.kneadProgress < .66) return;
    completeDuration('knead');
    var points = state.kneadPoints;
    var centerX = points.reduce(function (sum, point) { return sum + point.x; }, 0) / Math.max(points.length, 1);
    var centerY = points.reduce(function (sum, point) { return sum + point.y; }, 0) / Math.max(points.length, 1);
    var radii = points.map(function (point) { return Math.hypot(point.x - centerX, point.y - centerY); });
    var average = radii.reduce(function (sum, value) { return sum + value; }, 0) / Math.max(radii.length, 1);
    var variance = radii.reduce(function (sum, value) { return sum + Math.abs(value - average); }, 0) / Math.max(radii.length, 1);
    var circularity = clamp(1 - variance / Math.max(average, 1), 0, 1);
    var circles = state.kneadAngleTravel / (Math.PI * 2);
    var kneadSeconds = Math.max(0.1, (performance.now() - (state.kneadStartedAt || state.stepStartedAt)) / 1000);
    Engine.addSignal(state.session, 'behavior', {
      control: Math.round((circularity - .56) * 54),
      intuition: Math.round((.72 - circularity) * 28),
      boundary: Math.round((state.kneadProgress - .7) * 24),
    }, '你画了 ' + circles.toFixed(1) + ' 圈，用了 ' + kneadSeconds.toFixed(1) + ' 秒把碎片揉到一起', {
      diagnosticScore: Math.round(Math.abs(circularity - .56) * 70 + Math.min(30, circles * 4)),
    });
    goStep('stamp');
  }

  function pickStamp(id) {
    if (state.stampId !== id) {
      state.stampId = id;
      state.stampHoldMs = 0;
      state.stampReleases = 0;
    }
    render();
  }

  function confirmStamp() {
    var stamp = pickById(Content.stamps, state.stampId);
    if (!stamp || state.stampHoldMs < 700) return;
    completeDuration('stamp');
    Engine.addSignal(state.session, 'choice', stamp.deltas, '你把“' + stamp.label + '”按进了月饼');
    Engine.addSignal(state.session, 'behavior', {
      control: clamp((state.stampHoldMs - 900) / 32 + state.stampReleases * 4, -14, 36),
      decorum: clamp((state.stampHoldMs - 800) / 42, -12, 24),
    }, '压模用了 ' + (state.stampHoldMs / 1000).toFixed(1) + ' 秒，中途松开 ' + Math.max(0, state.stampReleases - 1) + ' 次');
    goStep('bake');
  }

  function takeMoon() {
    completeDuration('bake');
    Engine.addSignal(state.session, 'behavior', {
      novelty: clamp((state.bakeLevel - 70) * 1.4, -24, 38),
      control: state.bakeLevel >= 62 && state.bakeLevel <= 84 ? 18 : -8,
      intuition: clamp((state.bakeLevel - 68) * 1.1, -20, 30),
      aftertaste: clamp((state.bakeLevel - 72) * 1.2, -18, 32),
    }, '月饼烤到 ' + Math.round(state.bakeLevel) + '%，你才决定取月');
    Engine.scoreSession(state.session);
    goStep('reveal');
  }

  function saveResult() {
    var saved = {
      savedAt: Date.now(),
      result: state.result,
      choices: state.session.choices,
      snapshot: {
        skinId: state.skinId, fillingIndex: state.fillingIndex, fillingId: state.fillingId,
        blendIndex: state.blendIndex, ratio: state.ratio, ratioAdjustments: state.ratioAdjustments,
        surpriseId: state.surpriseId, fate: state.fate, fateChoice: state.fateChoice,
        stampId: state.stampId, bakeLevel: state.bakeLevel,
      },
    };
    if (safeWrite(LAST_RESULT_KEY, saved)) {
      state.savedResult = saved;
      showToast('这一轮月亮已经收进本地。');
    } else {
      showToast('当前环境没有保留本地记录，但结果仍在这一页。');
    }
  }

  function openLastResult() {
    var saved = readValidSavedResult();
    if (!saved) return;
    if (saved.snapshot) Object.assign(state, saved.snapshot);
    state.savedResult = saved;
    state.result = saved.result;
    goStep('result');
  }

  function openShare() {
    if (document.querySelector('.share-overlay')) return;
    var result = state.result;
    var trigger = app.querySelector('[data-action="open-share"]');
    if (trigger) trigger.disabled = true;
    Visuals.ready().then(function () {
      if (state.result !== result || document.querySelector('.share-overlay')) return;
      Visuals.drawShareCard(shareCanvas, result, result.model);
      var image = shareCanvas.toDataURL('image/png');
      var overlay = document.createElement('div');
      overlay.className = 'share-overlay';
      overlay.innerHTML = '<div class="share-panel"><img class="share-preview" alt="月亮人格结果图" src="' + image + '"><div class="action-row"><button class="quiet-action" data-action="close-share">返回结果册</button><button class="primary-action" data-action="save-share">存到相册</button></div></div>';
      document.body.appendChild(overlay);
    }).catch(function () {
      showToast('结果图还没准备好，请稍后再试');
    }).then(function () {
      if (trigger && trigger.isConnected) trigger.disabled = false;
    });
  }

  function saveShare() {
    var bridge = root.xhs && root.xhs.miniTool;
    if (!bridge || typeof bridge.writeTempFile !== 'function' || typeof bridge.saveImageToPhotosAlbum !== 'function') {
      showToast('当前预览环境不能直接存相册，请使用系统截图。');
      return;
    }
    var data = shareCanvas.toDataURL('image/png');
    Promise.resolve(bridge.writeTempFile({ data: data }))
      .then(function (result) { return bridge.saveImageToPhotosAlbum({ filePath: result.filePath }); })
      .then(function () { showToast('结果图已存到相册。'); })
      .catch(function () { showToast('相册保存没有完成，请检查权限后再试。'); });
  }

  function restart() {
    safeRemove(PROGRESS_KEY);
    state = createInitialState();
    render();
  }

  function backStep() {
    var destination = previousStep();
    if (!destination) return;
    if (state.step === 'fate') state.fateChoice = null;
    if (state.step === 'reveal') state.cutProgress = 0;
    goStep(destination);
    showToast('回到上一步，刚才的选择还在。');
  }

  app.addEventListener('click', function (event) {
    var control = event.target.closest('[data-action]');
    if (!control || control.disabled) return;
    var action = control.dataset.action;
    var handlers = {
      'pick-skin': function () { chooseSkin(control.dataset.id); },
      'confirm-skin': confirmSkin,
      'prev-filling': function () { turnFilling(-1); },
      'next-filling': function () { turnFilling(1); },
      'confirm-filling': confirmFilling,
      'select-blend': function () { state.blendIndex = Number(control.dataset.index); render(); },
      'confirm-blend': confirmBlend,
      'catch-surprise': function () { catchSurprise(control.dataset.id); },
      'dodge-surprise': dodgeSurprise,
      'confirm-surprise': confirmSurprise,
      'choose-fate': function () { chooseFate(control.dataset.side); },
      'confirm-knead': confirmKnead,
      'pick-stamp': function () { pickStamp(control.dataset.id); },
      'confirm-stamp': confirmStamp,
      'take-moon': takeMoon,
      'prev-result': function () { state.resultPage -= 1; render(); },
      'next-result': function () { state.resultPage += 1; render(); },
      'save-result': saveResult,
      'open-share': openShare,
      'open-last': openLastResult,
      'restart': restart,
      'back-step': backStep,
    };
    if (handlers[action]) handlers[action]();
  });

  document.body.addEventListener('click', function (event) {
    var control = event.target.closest('[data-action]');
    if (!control) return;
    if (control.dataset.action === 'close-share') {
      var overlay = document.querySelector('.share-overlay');
      if (overlay) overlay.remove();
    }
    if (control.dataset.action === 'save-share') saveShare();
  });

  root.addEventListener('error', function () {
    showToast('这一页没有完成，请重新进入小工具。');
  });

  render();
})(window);
