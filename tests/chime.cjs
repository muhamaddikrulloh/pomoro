const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');

require.extensions['.ts'] = require.extensions['.tsx'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, filename);
const slots = [];
let cursor = 0;
let effects = [];
let cleanups = [];
let interval;
let active;
let stored;
let failSave = false;
let loaded = true;
let failSeek = false;
let plays = 0;
let seeks = 0;
const player = { volume: 1, seekTo: async position => { assert.equal(position, 0); seeks++; if (failSeek) throw Error('audio unavailable'); }, play: () => plays++ };
let serverRendering = false;
let audioCreations = 0;
const react = {
  useSyncExternalStore: (_, client, server) => serverRendering ? server() : client(),
  createContext: () => ({ Provider: 'Provider' }),
  useRef: value => { const index = cursor++; slots[index] ??= { current: value }; return slots[index]; },
  useState: value => { const index = cursor++; if (!(index in slots)) slots[index] = typeof value === 'function' ? value() : value; return [slots[index], next => { slots[index] = next; }]; },
  useEffect: (effect, deps) => {
    const index = cursor++;
    if (!slots[index] || deps.some((value, i) => value !== slots[index][i])) {
      slots[index] = deps;
      effects.push(() => { cleanups[index]?.(); cleanups[index] = effect(); });
    }
  },
};
const originalLoad = Module._load;
const originalInterval = global.setInterval;
const originalClear = global.clearInterval;
Module._load = function (id, ...args) {
  if (id === 'react') return react;
  if (id === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }) };
  if (id === 'react-native') return { Platform: { OS: 'web' }, AppState: { currentState: 'active', addEventListener: (_, callback) => { active = callback; return { remove() {} }; } } };
  if (id === 'expo-audio') return { useAudioPlayer: () => { audioCreations++; return player; }, useAudioPlayerStatus: () => ({ isLoaded: loaded, error: null }) };
  if (id.endsWith('complete.wav')) return 1;
  if (id === '../storage/storage') return { loadState: async () => stored, saveState: async state => { if (failSave) throw Error('disk full'); stored = state; } };
  return originalLoad.call(this, id, ...args);
};
global.setInterval = callback => { interval = callback; return 1; };
global.clearInterval = () => {};
const { initialState, transition, completeDue } = require('../src/utils/model.ts');
const { AppProvider } = require('../src/context/AppContext.tsx');
const { useCompletionChime } = require('../src/hooks/use-completion-chime.ts');
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
function render(component = AppProvider) {
  cursor = 0;
  let tree = component({ children: null });
  if (typeof tree?.type === 'function') tree = tree.type(tree.props);
  const pending = effects;
  effects = [];
  pending.forEach(effect => effect());
  return tree.props ? tree.props.value : tree;
}
function reset() {
  cleanups.forEach(cleanup => cleanup?.());
  slots.length = 0;
  cleanups = [];
  effects = [];
}
const overdue = id => transition(initialState(), { type: 'start' }, Date.now() - 2000000, id);
async function settle(component) { await flush(); render(component); await flush(); }
async function run() {
  serverRendering = true;
  assert.equal(AppProvider({ children: null }), null);
  assert.equal(audioCreations, 0);
  serverRendering = false;
  stored = overdue('restore');
  render();
  await settle();
  assert.equal(plays, 1);
  assert.equal(stored.sessions.length, 1);
  interval(); active('active');
  await settle();
  assert.equal(plays, 1);
  reset(); render(); await settle();
  assert.equal(plays, 1);
  let value = render();
  await value.act({ type: 'reset' });
  await render().act({ type: 'start' });
  await render().act({ type: 'reset' });
  await settle();
  assert.equal(plays, 1);
  reset(); stored = overdue('mode'); render(); await settle();
  assert.equal(plays, 2);
  reset(); stored = overdue('failed'); failSave = true; render(); await settle();
  assert.equal(plays, 2);
  assert.equal(render().ready, false);
  failSave = false;
  await render().retryLoad(); await settle();
  assert.equal(plays, 3);
  reset(); stored = completeDue(overdue('old'), Date.now()); render(); await settle();
  assert.equal(plays, 3);
  reset(); loaded = false;
  let audio = render(useCompletionChime);
  audio.playCompletion('ready'); render(useCompletionChime); await flush();
  assert.equal(plays, 3);
  loaded = true; await settle(useCompletionChime);
  assert.equal(plays, 4);
  audio = render(useCompletionChime); audio.playCompletion('ready'); await settle(useCompletionChime);
  assert.equal(plays, 4);
  failSeek = true; audio.playCompletion('failure'); await settle(useCompletionChime);
  assert.match(render(useCompletionChime).error, /tetap tersimpan/);
  assert.equal(plays, 4);
  assert.equal(player.volume, 0.35);
  assert.equal(seeks, 5);
  failSeek = false;
  reset();
  stored = transition(initialState(), { type: 'start' }, Date.now(), 'action-due');
  render(); await settle();
  const originalNow = Date.now;
  try {
    Date.now = () => stored.timer.endsAt + 1;
    await render().act({ type: 'mode', mode: 'shortBreak' });
  } finally { Date.now = originalNow; }
  await settle();
  assert.equal(plays, 5);
  assert.equal(stored.timer.mode, 'shortBreak');
  assert.equal(stored.sessions.length, 1);
  interval(); await settle();
  assert.equal(plays, 5);
  const wav = fs.readFileSync(require('node:path').join(__dirname, '../assets/sounds/complete.wav'));
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wav.readUInt32LE(24), 44100);
  assert.equal(wav.readUInt32LE(40), wav.length - 44);
  assert.equal(wav.readInt16LE(44), 0);
  assert.equal(wav.readInt16LE(wav.length - 2), 0);
  console.log('PASS chime restore once, completed reload silence, reset silence, save failure retry, readiness, audio failure, WAV');
}
run().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  reset(); Module._load = originalLoad; global.setInterval = originalInterval; global.clearInterval = originalClear;
});
