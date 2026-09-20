const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

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

test('loading an unrelated cut image does not loop while the whole image is pending', () => {
  const script = `
    const pictures = [];
    global.Image = class {
      constructor() { this.complete = false; this.naturalWidth = 0; pictures.push(this); }
      set src(value) { this.source = value; }
    };
    const visuals = require('./assets/visuals.js');
    const context = new Proxy({}, {
      get(target, name) {
        if (name === 'createRadialGradient' || name === 'createLinearGradient')
          return () => ({ addColorStop() {} });
        return target[name] || (() => {});
      },
    });
    const canvas = {
      clientWidth: 200, clientHeight: 200, style: {}, isConnected: true,
      getContext() { return context; },
    };
    visuals.drawMooncake(canvas, { bakeLevel: 70, fillingId: 'lotus' }, 0);
    pictures[1].complete = true;
    pictures[1].naturalWidth = 900;
    pictures[1].onload();
    pictures[0].complete = true;
    pictures[0].naturalWidth = 900;
    pictures[0].onload();
    console.log('finished');
  `;
  const result = spawnSync(process.execPath, ['-e', script], {
    cwd: require('node:path').resolve(__dirname, '..'),
    encoding: 'utf8',
    timeout: 1800,
  });
  assert.equal(result.status, 0, result.error?.message || result.stderr);
  assert.match(result.stdout, /finished/);
});
