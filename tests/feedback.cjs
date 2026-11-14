const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');

const slots = [];
let cursor = 0;
let cleanup;
let timeout;
let cleared = false;
const context = { Provider: 'Provider' };
const react = {
  createContext: () => context,
  useCallback: callback => callback,
  useContext: () => null,
  useRef: value => { const index = cursor++; slots[index] ??= { current: value }; return slots[index]; },
  useState: value => { const index = cursor++; if (!(index in slots)) slots[index] = value; return [slots[index], next => { slots[index] = next; }]; },
  useEffect: effect => { cleanup?.(); cleanup = effect(); },
};
const originalLoad = Module._load;
const originalTimeout = global.setTimeout;
const originalClear = global.clearTimeout;
try {
  Module._load = function (id, ...args) {
    if (id === 'react') return react;
    if (id === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
    if (id === 'react-native') return { Platform: { OS: 'web' }, StyleSheet: { create: value => value } };
    if (id === 'react-native-safe-area-context') return { useSafeAreaInsets: () => ({ top: 0, bottom: 24, left: 0, right: 0 }) };
    if (id === '@/components/ui') return { ui: {}, Button: 'Button' };
    if (id === '@/constants/theme') return { palette: {} };
    return originalLoad.call(this, id, ...args);
  };
  global.setTimeout = (callback, delay) => { assert.equal(delay, 4000); timeout = callback; return 1; };
  global.clearTimeout = () => { cleared = true; };
  const filename = require.resolve('../src/context/FeedbackContext.tsx');
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const feedback = new Module(filename, module);
  feedback._compile(compiled, filename);
  const render = () => { cursor = 0; return feedback.exports.FeedbackProvider({ children: null }); };
  let tree = render();
  let called = 0;
  tree.props.value.confirm('Hapus?', 'Pesan', () => called++);
  tree = render();
  let modal = tree.props.children[2];
  assert.equal(modal.props.visible, true);
  modal.props.onClose();
  tree = render();
  assert.equal(called, 0);
  assert.equal(tree.props.children[2].props.visible, false);
  tree.props.value.confirm('Hapus?', 'Pesan', () => called++);
  tree = render();
  const submit = tree.props.children[2].props.children[1].props.onPress;
  submit();
  submit();
  assert.equal(called, 1);
  tree = render();
  tree.props.value.notify('Tersimpan.');
  tree = render();
  assert.ok(tree.props.children[1]);
  timeout();
  tree = render();
  assert.equal(tree.props.children[1], null);
  assert.equal(cleared, true);
  tree.props.value.notify('Tersimpan lagi.');
  tree = render();
  tree.props.children[1].props.children.props.children[1].props.onPress();
  tree = render();
  assert.equal(tree.props.children[1], null);
  assert.throws(() => feedback.exports.useFeedback(), /FeedbackProvider/);
  console.log('PASS feedback cancel, confirm once, snackbar timeout, dismiss, cleanup');
} finally {
  cleanup?.();
  Module._load = originalLoad;
  global.setTimeout = originalTimeout;
  global.clearTimeout = originalClear;
}
