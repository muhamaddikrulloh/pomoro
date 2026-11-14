const fs = require('node:fs');
const path = require('node:path');

const sampleRate = 44100;
const samples = Math.round(sampleRate * 1.4);
const wav = Buffer.alloc(44 + samples * 2);
wav.write('RIFF', 0);
wav.writeUInt32LE(wav.length - 8, 4);
wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(sampleRate, 24);
wav.writeUInt32LE(sampleRate * 2, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write('data', 36);
wav.writeUInt32LE(samples * 2, 40);
for (let index = 0; index < samples; index++) {
  const time = index / sampleRate;
  let value = 0;
  for (const [start, frequency] of [[0, 523.25], [0.46, 659.25]]) {
    const elapsed = time - start;
    const length = 0.9;
    if (elapsed >= 0 && elapsed < length) {
      const envelope = Math.min(1, elapsed / 0.04) * Math.min(1, (length - elapsed) / 0.25) * Math.exp(-2.5 * elapsed);
      value += 0.24 * envelope * Math.sin(2 * Math.PI * frequency * elapsed);
    }
  }
  wav.writeInt16LE(Math.round(value * 32767), 44 + index * 2);
}
const directory = path.join(__dirname, '../assets/sounds');
fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(path.join(directory, 'complete.wav'), wav);
