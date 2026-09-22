(function (root, factory) {
  var api = factory(root);
  root.MoonVisuals = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';

  var pendingDraws = new Map();
  function redrawPending() {
    var queued = Array.from(pendingDraws.entries());
    pendingDraws.clear();
    queued.forEach(function (entry) {
      var canvas = entry[0];
      var args = entry[1];
      if (canvas.isConnected) drawMooncake(canvas, args.model, args.cut, args.size);
    });
  }
  function localImage(source) {
    if (typeof Image === 'undefined') return { image: null, ready: Promise.resolve() };
    var image = new Image();
    var ready = new Promise(function (resolve) {
      image.onload = function () { redrawPending(); resolve(); };
      image.onerror = function () { resolve(); };
    });
    image.src = source;
    return { image: image, ready: ready };
  }
  var wholeAsset = localImage('./assets/mooncake-whole.webp');
  var cutAssets = {};
  ['lotus', 'sesame', 'osmanthus', 'custard', 'coffee'].forEach(function (id) {
    cutAssets[id] = localImage('./assets/mooncake-cut-' + id + '.webp');
  });
  var cakeImage = wholeAsset.image;
  var imagesReady = Promise.all([wholeAsset.ready].concat(Object.keys(cutAssets).map(function (id) { return cutAssets[id].ready; })));

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

  function drawStampPattern(ctx, cx, cy, radius, stampId, alpha) {
    var r = radius * .47;
    var id = stampId || 'full-moon';
    ctx.save();
    ctx.globalAlpha = alpha == null ? .42 : alpha;
    ctx.strokeStyle = 'rgba(73,34,20,.84)';
    ctx.fillStyle = 'rgba(73,34,20,.64)';
    ctx.lineWidth = Math.max(1, radius * .018);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * .72, 0, Math.PI * 2);
    ctx.stroke();
    function petal(angle, distance, size) {
      var px = cx + Math.cos(angle) * distance;
      var py = cy + Math.sin(angle) * distance;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle + Math.PI / 2);
      ctx.beginPath();
      ctx.ellipse(0, 0, size * .46, size, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (id === 'osmanthus') {
      for (var flower = 0; flower < 5; flower += 1) {
        var flowerAngle = flower * Math.PI * 2 / 5 - Math.PI / 2;
        var fx = cx + Math.cos(flowerAngle) * r * .42;
        var fy = cy + Math.sin(flowerAngle) * r * .42;
        for (var leaf = 0; leaf < 5; leaf += 1) petal(flowerAngle + leaf * Math.PI * 2 / 5, r * .42, r * .115);
        ctx.beginPath(); ctx.arc(fx, fy, r * .045, 0, Math.PI * 2); ctx.fill();
      }
    } else if (id === 'cloud' || id === 'ruyi') {
      for (var cloud = 0; cloud < 4; cloud += 1) {
        var cloudAngle = cloud * Math.PI / 2;
        ctx.save();
        ctx.translate(cx + Math.cos(cloudAngle) * r * .33, cy + Math.sin(cloudAngle) * r * .33);
        ctx.rotate(cloudAngle);
        ctx.beginPath();
        ctx.arc(-r * .12, 0, r * .1, Math.PI * .15, Math.PI * 1.85);
        ctx.arc(0, -r * .06, r * .13, Math.PI * .1, Math.PI * 1.8);
        ctx.arc(r * .13, 0, r * .09, Math.PI * 1.15, Math.PI * 1.9);
        ctx.stroke();
        ctx.restore();
      }
      if (id === 'ruyi') { ctx.beginPath(); ctx.arc(cx, cy, r * .18, 0, Math.PI * 2); ctx.stroke(); }
    } else if (id === 'rabbit') {
      ctx.beginPath(); ctx.ellipse(cx, cy + r * .08, r * .19, r * .25, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx - r * .09, cy - r * .2, r * .06, r * .18, -.25, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx + r * .09, cy - r * .2, r * .06, r * .18, .25, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + r * .19, cy + r * .18, r * .08, 0, Math.PI * 2); ctx.stroke();
    } else if (id === 'window') {
      ctx.beginPath(); ctx.moveTo(cx - r * .52, cy); ctx.lineTo(cx + r * .52, cy); ctx.moveTo(cx, cy - r * .52); ctx.lineTo(cx, cy + r * .52); ctx.stroke();
      for (var diagonal = -1; diagonal <= 1; diagonal += 2) {
        ctx.beginPath(); ctx.moveTo(cx - r * .48, cy + diagonal * r * .32); ctx.lineTo(cx + r * .48, cy - diagonal * r * .32); ctx.stroke();
      }
    } else if (id === 'harvest') {
      for (var grainSide = -1; grainSide <= 1; grainSide += 2) {
        ctx.beginPath(); ctx.moveTo(cx + grainSide * r * .1, cy + r * .48); ctx.quadraticCurveTo(cx + grainSide * r * .32, cy, cx + grainSide * r * .14, cy - r * .48); ctx.stroke();
        for (var grain = 0; grain < 4; grain += 1) {
          var gy = cy + r * .28 - grain * r * .18;
          ctx.beginPath(); ctx.ellipse(cx + grainSide * (r * .18 + grain * r * .035), gy, r * .045, r * .085, grainSide * .8, 0, Math.PI * 2); ctx.stroke();
        }
      }
    } else if (id === 'fish') {
      [-1, 1].forEach(function (side) {
        ctx.save(); ctx.translate(cx + side * r * .2, cy); ctx.scale(side, 1);
        ctx.beginPath(); ctx.ellipse(0, 0, r * .18, r * .11, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-r * .18, 0); ctx.lineTo(-r * .32, -r * .12); ctx.lineTo(-r * .32, r * .12); ctx.closePath(); ctx.stroke();
        ctx.restore();
      });
    } else {
      for (var i = 0; i < 8; i += 1) petal(i * Math.PI * 2 / 8, r * .31, r * .17);
      ctx.beginPath(); ctx.arc(cx, cy, r * .1, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
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
    var offset = cut * radius * 0.19;
    var crust = bake > 88 ? '#6c3022' : bake > 65 ? '#a95f2f' : '#c79557';
    var lightCrust = bake > 88 ? '#9a4930' : bake > 65 ? '#d28a45' : '#e0b877';
    var filling = (model && model.fillingColor) || '#c99c62';
    var blendA = (model && model.blendColors && model.blendColors[0]) || '#6c4431';
    var blendB = (model && model.blendColors && model.blendColors[1]) || '#e0b756';
    var ratio = clamp((model && model.ratio) || 50, 10, 90) / 100;
    var geometry = getMooncakeGeometry(model, radius);
    var hasPhoto = cakeImage && cakeImage.complete && cakeImage.naturalWidth > 0;
    var chosenCut = cutAssets[model && model.fillingId] || cutAssets.lotus;
    var cutImage = chosenCut.image;
    var hasCutPhoto = cutImage && cutImage.complete && cutImage.naturalWidth > 0;
    var skinId = model && model.skinId;
    if ((cut >= .98 && !hasCutPhoto) || (cut < .98 && !hasPhoto)) {
      pendingDraws.set(canvas, { model: model, cut: cutProgress, size: preferredSize });
    } else {
      pendingDraws.delete(canvas);
    }

    ctx.clearRect(0, 0, width, height);
    if (cut >= .98 && hasCutPhoto) {
      ctx.save();
      if (skinId === 'snow') ctx.filter = 'saturate(.36) brightness(1.15)';
      else if (skinId === 'tea') ctx.filter = 'sepia(.18) hue-rotate(29deg) saturate(.78)';
      else if (skinId === 'charcoal') ctx.filter = 'grayscale(.75) brightness(.68)';
      else if (skinId === 'osmanthus') ctx.filter = 'sepia(.34) saturate(1.1) brightness(1.06)';
      else if (skinId === 'purple') ctx.filter = 'sepia(.22) hue-rotate(238deg) saturate(.72) brightness(.84)';
      var imageX = cx - radius * 1.3;
      var imageY = cy - radius * 1.28;
      var imageSize = radius * 2.6;
      ctx.drawImage(cutImage, imageX, imageY, imageSize, imageSize);
      ctx.restore();
      if (skinId && skinId !== 'amber') {
        var faces = [
          [[443,259],[471,278],[474,357],[392,460],[296,568],[252,590],[252,515],[305,418],[375,311]],
          [[520,275],[554,303],[618,375],[676,476],[702,681],[665,680],[602,578],[534,490],[504,413],[503,329]],
        ];
        ctx.save();
        ctx.beginPath();
        faces.forEach(function (points) {
          points.forEach(function (point, index) {
            var x = imageX + point[0] / 900 * imageSize;
            var y = imageY + point[1] / 900 * imageSize;
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.closePath();
        });
        ctx.clip();
        ctx.drawImage(cutImage, imageX, imageY, imageSize, imageSize);
        ctx.restore();
      }
      drawStampPattern(ctx, cx - radius * .35, cy - radius * .08, radius * .5, model && model.stampId, .38);
      drawStampPattern(ctx, cx + radius * .35, cy - radius * .08, radius * .5, model && model.stampId, .38);
      return;
    }
    function drawPhoto(originX) {
      ctx.save();
      if (skinId === 'snow') ctx.filter = 'saturate(.38) brightness(1.16)';
      else if (skinId === 'tea') ctx.filter = 'sepia(.2) hue-rotate(30deg) saturate(.75)';
      else if (skinId === 'charcoal') ctx.filter = 'grayscale(.8) brightness(.64)';
      else if (skinId === 'osmanthus') ctx.filter = 'sepia(.35) saturate(1.12) brightness(1.04)';
      else if (skinId === 'purple') ctx.filter = 'sepia(.22) hue-rotate(238deg) saturate(.74) brightness(.84)';
      else ctx.filter = 'saturate(' + (0.83 + bake / 170).toFixed(2) + ') brightness(' + (1.12 - bake / 600).toFixed(2) + ')';
      ctx.drawImage(cakeImage, originX - radius * 1.3, cy - radius * 1.32, radius * 2.6, radius * 2.6);
      ctx.restore();
    }
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
      if (hasPhoto) {
        ctx.save();
        ctx.beginPath();
        if (side < 0) ctx.rect(originX - radius * 1.35, cy - radius * 1.35, radius * 1.35, radius * 2.7);
        else ctx.rect(originX, cy - radius * 1.35, radius * 1.35, radius * 2.7);
        ctx.clip();
        drawPhoto(originX);
        ctx.restore();
        return;
      }
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
      if (hasPhoto) {
        drawPhoto(cx);
        drawStampPattern(ctx, cx, cy - radius * .03, radius, model && model.stampId, .38);
        return;
      }
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = shell;
      ctx.shadowColor = 'rgba(0,0,0,.3)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 8;
      ctx.fill();
      drawPattern(cx, 'full');
      drawStampPattern(ctx, cx, cy - radius * .03, radius, model && model.stampId, .52);
      return;
    }

    drawHalf(-1);
    drawHalf(1);

    var faceWidth = Math.max(2, radius * 0.17 * cut);
    var faceCy = cy + radius * 0.27;
    var faceHeight = Math.min(radius * 0.56, geometry.innerHeight * 0.84);
    [-1, 1].forEach(function (side) {
      var faceX = cx + side * offset;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(faceX, faceCy, faceWidth, faceHeight + geometry.shellThickness * 0.17, 0, 0, Math.PI * 2);
      var cutCrust = ctx.createLinearGradient(faceX - faceWidth, faceCy, faceX + faceWidth, faceCy);
      cutCrust.addColorStop(0, lightCrust);
      cutCrust.addColorStop(.5, '#f2d6a2');
      cutCrust.addColorStop(1, crust);
      ctx.fillStyle = cutCrust;
      ctx.fill();
      ctx.beginPath();
      var innerWidth = Math.max(1, faceWidth - geometry.shellThickness * 0.16);
      var innerHeight = faceHeight - geometry.shellThickness * 0.13;
      ctx.ellipse(faceX, faceCy, innerWidth, innerHeight, 0, 0, Math.PI * 2);
      var fillingGradient = ctx.createLinearGradient(faceX - innerWidth, faceCy, faceX + innerWidth, faceCy);
      fillingGradient.addColorStop(0, '#f0d8ac');
      fillingGradient.addColorStop(.35, filling);
      fillingGradient.addColorStop(1, '#8e6640');
      ctx.fillStyle = fillingGradient;
      ctx.fill();
      ctx.clip();
      var topEnd = faceCy - innerHeight + innerHeight * 2 * ratio + geometry.layerOffset * 0.42;
      ctx.globalAlpha = .32;
      ctx.fillStyle = blendA;
      ctx.fillRect(faceX - faceWidth, faceCy - innerHeight, faceWidth * 2, Math.max(0, topEnd - (faceCy - innerHeight)));
      ctx.fillStyle = blendB;
      ctx.fillRect(faceX - faceWidth, topEnd, faceWidth * 2, Math.max(0, faceCy + innerHeight - topEnd));
      ctx.globalAlpha = 1;
      for (var grain = 0; grain < 32; grain += 1) {
        ctx.beginPath();
        ctx.arc(faceX + (seeded(grain, side + 37) - .5) * faceWidth * 1.8, faceCy + (seeded(grain, side + 41) - .5) * innerHeight * 1.8, .4 + seeded(grain, 43) * .8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(79,48,23,.22)';
        ctx.fill();
      }
      ctx.restore();
      ctx.beginPath();
      ctx.ellipse(faceX, faceCy, faceWidth, faceHeight + geometry.shellThickness * 0.17, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(103,60,26,.37)';
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
    ctx.fillStyle = '#f7f4ed';
    ctx.fillRect(0, 0, 1080, 1440);
    ctx.fillStyle = '#fff9ee';
    ctx.fillRect(55, 55, 970, 1330);
    ctx.fillStyle = '#e85c35';
    ctx.fillRect(55, 55, 970, 13);
    ctx.fillStyle = '#29251f';
    ctx.font = '800 37px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('月亮露馅了', 115, 150);
    ctx.fillStyle = '#e85c35';
    ctx.fillRect(115, 184, 124, 6);
    ctx.fillStyle = '#805d44';
    ctx.font = '700 25px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('第' + result.number + '轮月饼', 115, 247);
    ctx.fillStyle = '#f6e2c4';
    ctx.beginPath();
    ctx.arc(540, 600, 375, 0, Math.PI * 2);
    ctx.fill();

    var moonCanvas = document.createElement('canvas');
    drawMooncake(moonCanvas, model || {}, 1, 660);
    ctx.drawImage(moonCanvas, 210, 274, 660, 660);

    ctx.fillStyle = '#29251f';
    ctx.font = '900 63px "PingFang SC", "Microsoft YaHei", sans-serif';
    wrapText(ctx, result.name, 115, 1045, 850, 82, 2);
    ctx.fillStyle = '#6b5c4b';
    ctx.font = '30px "PingFang SC", "Microsoft YaHei", sans-serif';
    wrapText(ctx, result.line, 115, 1170, 850, 48, 3);
    ctx.strokeStyle = '#dfd2bf';
    ctx.beginPath();
    ctx.moveTo(115, 1264);
    ctx.lineTo(965, 1264);
    ctx.stroke();
    ctx.fillStyle = '#8b7d6c';
    ctx.font = '25px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('你亲手做的月饼，藏着你自己的配方', 115, 1324);
    return canvas;
  }

  return {
    drawMoon: drawMoon,
    drawMooncake: drawMooncake,
    drawShareCard: drawShareCard,
    fitCanvas: fitCanvas,
    getMooncakeGeometry: getMooncakeGeometry,
    ready: function () { return imagesReady; },
  };
});
