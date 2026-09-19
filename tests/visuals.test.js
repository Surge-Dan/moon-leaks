const test = require('node:test');
const assert = require('node:assert/strict');

const Visuals = require('../assets/visuals.js');

test('fitCanvas can read pixel density from its runtime root', () => {
  const context = { setTransform() {} };
  const canvas = {
    clientWidth: 320,
    clientHeight: 240,
    style: {},
    getContext() { return context; },
  };

  assert.doesNotThrow(() => Visuals.fitCanvas(canvas));
  assert.equal(canvas.width, 320);
  assert.equal(canvas.height, 240);
});

test('mooncake geometry maps personality values into visible structure', () => {
  const restrained = Visuals.getMooncakeGeometry({
    emotion: 20,
    boundary: 20,
    control: 20,
    intuition: 20,
  }, 100);
  const intense = Visuals.getMooncakeGeometry({
    emotion: 85,
    boundary: 85,
    control: 85,
    intuition: 85,
  }, 100);

  assert.notEqual(restrained.innerHeight, intense.innerHeight);
  assert.notEqual(restrained.shellThickness, intense.shellThickness);
  assert.notEqual(restrained.patternAlpha, intense.patternAlpha);
  assert.notEqual(restrained.layerOffset, intense.layerOffset);
});
