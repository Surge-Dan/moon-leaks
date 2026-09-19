(function (root, factory) {
  var api = factory(root);
  root.MoonVisuals = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function fitCanvas(canvas, preferredWidth, preferredHeight) {
    var ratio = Math.min(root.devicePixelRatio || 1, 2);
    var width = preferredWidth || canvas.clientWidth || 320;
    var height = preferredHeight || canvas.clientHeight || width;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    var context = canvas.getContext('2d');
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { context: context, width: width, height: height };
  }

  function seeded(index, salt) {
    var value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
    return value - Math.floor(value);
  }

  function getMooncakeGeometry(model, radius) {
    var data = model || {};
    var r = Math.max(1, Number(radius) || 1);
    var emotion = clamp(Number(data.emotion) || 50, 0, 100);
    var boundary = clamp(Number(data.boundary) || 50, 0, 100);
    var control = clamp(Number(data.control) || 50, 0, 100);
    var intuition = clamp(Number(data.intuition) || 50, 0, 100);
    return {
      innerHeight: r * (0.54 + emotion / 100 * 0.24),
      shellThickness: r * (0.24 - boundary / 100 * 0.1),
      patternAlpha: 0.2 + control / 100 * 0.38,
      layerOffset: r * ((intuition - 50) / 50 * 0.1),
    };
  }

  function drawMoon(canvas, fullness) {
    var fitted = fitCanvas(canvas);
    var ctx = fitted.context;
    var width = fitted.width;
    var height = fitted.height;
    var radius = Math.min(width, height) * 0.38;
    var cx = width / 2;
    var cy = height / 2;
    var glow = ctx.createRadialGradient(cx, cy, radius * 0.25, cx, cy, radius * 1.35);
    glow.addColorStop(0, 'rgba(239,218,159,.28)');
    glow.addColorStop(0.56, 'rgba(217,185,119,.12)');
    glow.addColorStop(1, 'rgba(217,185,119,0)');
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();
    var face = ctx.createRadialGradient(cx - radius * 0.35, cy - radius * 0.4, radius * 0.08, cx, cy, radius);
    face.addColorStop(0, '#fff8dd');
    face.addColorStop(0.48, '#e2c988');
    face.addColorStop(0.8, '#b88a4d');
    face.addColorStop(1, '#70442c');
    ctx.fillStyle = face;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

    for (var i = 0; i < 44; i += 1) {
      var angle = seeded(i, 2) * Math.PI * 2;
      var distance = Math.sqrt(seeded(i, 7)) * radius * 0.82;
      var craterRadius = radius * (0.018 + seeded(i, 5) * 0.085);
      var x = cx + Math.cos(angle) * distance;
      var y = cy + Math.sin(angle) * distance;
      ctx.beginPath();
      ctx.arc(x, y, craterRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(82,54,36,' + (0.08 + seeded(i, 11) * 0.13) + ')';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x - craterRadius * 0.2, y - craterRadius * 0.25, craterRadius * 0.72, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,247,217,.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    var missing = clamp(1 - (fullness == null ? 0.72 : fullness), 0, 1);
    if (missing > 0.01) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(cx + radius * (0.86 - missing * 0.24), cy - radius * 0.16, radius * (0.46 + missing * 0.28), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawMooncake(canvas, model, cutProgress, preferredSize) {
    var fitted = fitCanvas(canvas, preferredSize, preferredSize);
    var ctx = fitted.context;
    var width = fitted.width;
    var height = fitted.height;
    var radius = Math.min(width, height) * 0.34;
    var cx = width / 2;
    var cy = height / 2;
    var bake = clamp((model && model.bakeLevel) || 68, 18, 100);
    var cut = clamp(cutProgress || 0, 0, 1);
    var offset = cut * radius * 0.16;
    var crust = bake > 88 ? '#6c3022' : bake > 65 ? '#a95f2f' : '#c79557';
    var lightCrust = bake > 88 ? '#9a4930' : bake > 65 ? '#d28a45' : '#e0b877';
    var filling = (model && model.fillingColor) || '#c99c62';
    var blendA = (model && model.blendColors && model.blendColors[0]) || '#6c4431';
    var blendB = (model && model.blendColors && model.blendColors[1]) || '#e0b756';
    var ratio = clamp((model && model.ratio) || 50, 10, 90) / 100;
    var geometry = getMooncakeGeometry(model, radius);

    ctx.clearRect(0, 0, width, height);
    var shell = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.38, radius * 0.06, cx, cy, radius);
    shell.addColorStop(0, lightCrust);
    shell.addColorStop(0.74, crust);
    shell.addColorStop(1, '#54251d');

    function drawPattern(originX, clipSide) {
      ctx.save();
      ctx.beginPath();
      if (clipSide === 'left') {
        ctx.arc(originX, cy, radius, Math.PI / 2, Math.PI * 1.5);
      } else if (clipSide === 'right') {
        ctx.arc(originX, cy, radius, -Math.PI / 2, Math.PI / 2);
      } else {
        ctx.arc(originX, cy, radius, 0, Math.PI * 2);
      }
      ctx.closePath();
      ctx.clip();
      ctx.strokeStyle = 'rgba(67,30,20,' + geometry.patternAlpha.toFixed(2) + ')';
      ctx.lineWidth = 1.7;
      for (var ring = 0.36; ring < 0.88; ring += 0.17) {
        ctx.beginPath();
        ctx.arc(originX, cy, radius * ring, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (var spoke = 0; spoke < 8; spoke += 1) {
        var a = (Math.PI * 2 * spoke) / 8;
        ctx.beginPath();
        ctx.moveTo(originX + Math.cos(a) * radius * 0.22, cy + Math.sin(a) * radius * 0.22);
        ctx.lineTo(originX + Math.cos(a) * radius * 0.84, cy + Math.sin(a) * radius * 0.84);
        ctx.stroke();
      }
      for (var crumb = 0; crumb < 22; crumb += 1) {
        var crumbAngle = seeded(crumb, 19) * Math.PI * 2;
        var crumbDistance = Math.sqrt(seeded(crumb, 23)) * radius * 0.78;
        ctx.beginPath();
        ctx.arc(originX + Math.cos(crumbAngle) * crumbDistance, cy + Math.sin(crumbAngle) * crumbDistance, 0.7 + seeded(crumb, 29) * 1.1, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(74,34,23,.2)';
        ctx.fill();
      }
      ctx.restore();
    }

    function drawHalf(side) {
      var originX = cx + side * offset;
      ctx.save();
      ctx.beginPath();
      if (side < 0) ctx.arc(originX, cy, radius, Math.PI / 2, Math.PI * 1.5);
      else ctx.arc(originX, cy, radius, -Math.PI / 2, Math.PI / 2);
      ctx.closePath();
      ctx.fillStyle = shell;
      ctx.shadowColor = 'rgba(0,0,0,.28)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 8;
      ctx.fill();
      ctx.restore();
      drawPattern(originX, side < 0 ? 'left' : 'right');
    }

    if (cut <= 0.02) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = shell;
      ctx.shadowColor = 'rgba(0,0,0,.3)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 8;
      ctx.fill();
      drawPattern(cx, 'full');
      return;
    }

    drawHalf(-1);
    drawHalf(1);

    var faceWidth = Math.max(2, radius * 0.15 * cut);
    [-1, 1].forEach(function (side) {
      var faceX = cx + side * offset;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(faceX, cy, faceWidth, geometry.innerHeight + geometry.shellThickness, 0, 0, Math.PI * 2);
      ctx.fillStyle = lightCrust;
      ctx.fill();
      ctx.beginPath();
      var innerWidth = Math.max(1, faceWidth - geometry.shellThickness * 0.1);
      ctx.ellipse(faceX, cy, innerWidth, geometry.innerHeight, 0, 0, Math.PI * 2);
      ctx.fillStyle = filling;
      ctx.fill();
      ctx.clip();
      var topEnd = cy - geometry.innerHeight + geometry.innerHeight * 2 * ratio + geometry.layerOffset;
      ctx.fillStyle = blendA;
      ctx.fillRect(faceX - faceWidth, cy - geometry.innerHeight, faceWidth * 2, Math.max(0, topEnd - (cy - geometry.innerHeight)));
      ctx.fillStyle = blendB;
      ctx.fillRect(faceX - faceWidth, topEnd, faceWidth * 2, Math.max(0, cy + geometry.innerHeight - topEnd));
      for (var grain = 0; grain < 13; grain += 1) {
        ctx.beginPath();
        ctx.arc(faceX + (seeded(grain, side + 37) - .5) * faceWidth, cy + (seeded(grain, side + 41) - .5) * radius * 1.18, .6 + seeded(grain, 43), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(58,28,21,.25)';
        ctx.fill();
      }
      ctx.restore();
      ctx.beginPath();
      ctx.ellipse(faceX, cy, faceWidth, geometry.innerHeight + geometry.shellThickness, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(74,34,23,.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    var lines = [];
    var current = '';
    Array.from(text).forEach(function (character) {
      var trial = current + character;
      if (ctx.measureText(trial).width > maxWidth && current) {
        lines.push(current);
        current = character;
      } else {
        current = trial;
      }
    });
    if (current) lines.push(current);
    lines.slice(0, maxLines || lines.length).forEach(function (line, index) {
      ctx.fillText(line, x, y + index * lineHeight);
    });
  }

  function drawShareCard(canvas, result, model) {
    var ctx = canvas.getContext('2d');
    canvas.width = 1080;
    canvas.height = 1440;
    ctx.fillStyle = '#17140f';
    ctx.fillRect(0, 0, 1080, 1440);
    var glow = ctx.createRadialGradient(540, 500, 30, 540, 500, 430);
    glow.addColorStop(0, 'rgba(217,185,119,.26)');
    glow.addColorStop(1, 'rgba(217,185,119,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(80, 40, 920, 920);

    var moonCanvas = document.createElement('canvas');
    drawMooncake(moonCanvas, model || {}, 1, 600);
    ctx.drawImage(moonCanvas, 240, 160, 600, 600);

    ctx.fillStyle = '#d9b977';
    ctx.font = '28px ui-monospace, monospace';
    ctx.fillText('MOON ARCHIVE / ' + result.number, 92, 848);
    ctx.fillStyle = '#f1e8d4';
    ctx.font = '700 62px STSong, SimSun, serif';
    wrapText(ctx, result.name, 92, 950, 896, 78, 2);
    ctx.fillStyle = '#bdb09b';
    ctx.font = '34px -apple-system, BlinkMacSystemFont, sans-serif';
    wrapText(ctx, result.line, 92, 1132, 860, 52, 3);
    ctx.strokeStyle = 'rgba(217,185,119,.45)';
    ctx.beginPath();
    ctx.moveTo(92, 1280);
    ctx.lineTo(988, 1280);
    ctx.stroke();
    ctx.fillStyle = '#897c69';
    ctx.font = '24px ui-monospace, monospace';
    ctx.fillText('月亮露馅了 · 外面都可以很圆，里面各有各的馅', 92, 1340);
    return canvas;
  }

  return {
    drawMoon: drawMoon,
    drawMooncake: drawMooncake,
    drawShareCard: drawShareCard,
    fitCanvas: fitCanvas,
    getMooncakeGeometry: getMooncakeGeometry,
  };
});
