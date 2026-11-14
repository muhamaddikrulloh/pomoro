const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');
const { expo } = require('../app.json');

const root = path.resolve(__dirname, '..');
const assets = [
  ['icon.png', 1024, false],
  ['android-icon-foreground.png', 1024, true],
  ['android-icon-monochrome.png', 1024, true],
  ['favicon.png', 48, false],
  ['splash-icon.png', 1024, true],
];

for (const [name, size, transparent] of assets) {
  const image = PNG.sync.read(fs.readFileSync(path.join(root, 'assets/images', name)));
  assert.equal(image.width, size, `${name}: width`);
  assert.equal(image.height, size, `${name}: height`);
  assert.equal(image.data[3], transparent ? 0 : 255, `${name}: corner alpha`);
  let visible = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const alpha = image.data[(y * size + x) * 4 + 3];
      if (!transparent) assert.equal(alpha, 255, `${name}: opaque background`);
      if (alpha === 0) continue;
      visible++;
      if (name.startsWith('android-icon')) {
        assert(x >= size * 0.17 && x < size * 0.83, `${name}: horizontal safe area`);
        assert(y >= size * 0.17 && y < size * 0.83, `${name}: vertical safe area`);
      }
    }
  }
  assert(visible > size * size * 0.05, `${name}: artwork present`);
}

assert.equal(expo.ios.icon, expo.icon);
assert.equal(expo.android.adaptiveIcon.backgroundColor, '#171717');
assert.equal(expo.android.adaptiveIcon.backgroundImage, undefined);
const splash = expo.plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen');
assert.equal(splash[1].backgroundColor, '#F8F7F4');
console.log('Icon dimensions, opacity, adaptive safe area, and config passed.');
