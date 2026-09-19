(function (root, factory) {
  var api = factory();
  root.MoonEngine = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var TRAIT_KEYS = [
    'novelty',
    'control',
    'emotion',
    'intuition',
    'aftertaste',
    'boundary',
    'decorum',
  ];

  function neutralTraits() {
    return TRAIT_KEYS.reduce(function (traits, key) {
      traits[key] = 50;
      return traits;
    }, {});
  }

  function createSession(id) {
    return {
      id: id,
      step: 'intro',
      traits: neutralTraits(),
      choices: {},
      actions: [],
      signals: [],
      durations: [],
    };
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function median(values) {
    if (!values.length) return 0;
    var sorted = values.slice().sort(function (a, b) { return a - b; });
    var middle = Math.floor(sorted.length / 2);
    if (sorted.length % 2) return sorted[middle];
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  function recordDuration(session, step, durationMs) {
    var duration = Math.max(0, Number(durationMs) || 0);
    session.durations.push(duration);
    session.actions.push({ type: 'duration', step: step, durationMs: duration });
    return session;
  }

  function getDurationRatio(session, durationMs) {
    var baseline = median(session.durations);
    if (!baseline) return 1;
    return Math.round((Math.max(0, durationMs) / baseline) * 100) / 100;
  }

  function addSignal(session, kind, deltas, evidence, meta) {
    var cleanDeltas = {};
    TRAIT_KEYS.forEach(function (key) {
      if (typeof deltas[key] === 'number' && Number.isFinite(deltas[key])) {
        cleanDeltas[key] = clamp(deltas[key], -50, 50);
      }
    });
    session.signals.push({
      kind: kind,
      deltas: cleanDeltas,
      evidence: evidence || '',
      meta: meta || {},
    });
    return session;
  }

  function recordSurprise(session, ingredient, outcome, metrics) {
    var ingredientId = ingredient && ingredient.id ? ingredient.id : null;
    session.choices.surprise = outcome === 'caught' && ingredientId ? ingredientId : 'none';
    session.actions.push({
      type: 'surprise',
      ingredientId: ingredientId,
      outcome: outcome,
      metrics: metrics || {},
    });
    if (outcome === 'caught' && ingredientId) {
      addSignal(
        session,
        'behavior',
        { novelty: 20, intuition: 12, boundary: 8 },
        '你接住了“' + (ingredient.name || ingredient.id) + '”',
        { ingredientId: ingredient.id },
      );
    }
    return session;
  }

  function scoreSession(session) {
    var weights = { choice: 0.45, behavior: 0.45, fate: 0.1 };
    var scores = neutralTraits();
    TRAIT_KEYS.forEach(function (trait) {
      Object.keys(weights).forEach(function (kind) {
        var values = session.signals
          .filter(function (signal) {
            return signal.kind === kind && typeof signal.deltas[trait] === 'number';
          })
          .map(function (signal) { return signal.deltas[trait]; });
        if (values.length) {
          var average = values.reduce(function (sum, value) { return sum + value; }, 0) / values.length;
          scores[trait] += average * weights[kind];
        }
      });
      scores[trait] = Math.round(clamp(scores[trait], 0, 100));
    });
    session.traits = scores;
    return scores;
  }

  function classifyTraits(traits) {
    return [
      traits.novelty >= 50 ? 'N' : 'F',
      traits.control >= 50 ? 'C' : 'L',
      traits.emotion >= 50 ? 'E' : 'R',
      traits.intuition >= 50 ? 'I' : 'A',
    ].join('');
  }

  function getHiddenPages(metrics) {
    var pages = [];
    if ((metrics.ratioAdjustments || 0) >= 8) pages.push('indecision');
    if ((metrics.bakeLevel || 0) >= 90) pages.push('charred-edge');
    return pages;
  }

  function pickFateIndex(seed, count) {
    var safeCount = Math.max(1, Math.floor(Number(count) || 1));
    return Math.floor((Number(seed) >>> 0) / 4) % safeCount;
  }

  function signalMagnitude(signal) {
    if (signal.meta && typeof signal.meta.diagnosticScore === 'number' && Number.isFinite(signal.meta.diagnosticScore)) {
      return Math.max(0, signal.meta.diagnosticScore);
    }
    return Object.keys(signal.deltas).reduce(function (max, key) {
      return Math.max(max, Math.abs(signal.deltas[key]));
    }, 0);
  }

  function selectEvidence(session, limit) {
    return session.signals
      .filter(function (signal) { return Boolean(signal.evidence); })
      .slice()
      .sort(function (a, b) { return signalMagnitude(b) - signalMagnitude(a); })
      .slice(0, limit || 5)
      .map(function (signal) { return signal.evidence; });
  }

  return {
    TRAIT_KEYS: TRAIT_KEYS,
    addSignal: addSignal,
    classifyTraits: classifyTraits,
    createSession: createSession,
    getDurationRatio: getDurationRatio,
    getHiddenPages: getHiddenPages,
    median: median,
    pickFateIndex: pickFateIndex,
    recordDuration: recordDuration,
    recordSurprise: recordSurprise,
    scoreSession: scoreSession,
    selectEvidence: selectEvidence,
  };
});
