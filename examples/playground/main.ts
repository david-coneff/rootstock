// main.ts — rootstock capability playground (the demo "core HTML" source).
//
// A small, runtime proof of the web adapter: it boots `rootstock/web`, prints
// the detected platform capabilities, and wires live controls to the dialog,
// notification, theme, and component subsystems. esbuild rolls this modular
// source up into one self-contained examples/playground.html (see build.mjs) —
// the same rhiz-Partition modality-B build the scion apps (docket, tessel) use.
import '../../styles/rootstock.css';
import './playground.css';
import { createWebRootstock } from '../../src/adapters/web/index.js';

const rs = createWebRootstock();
const app = document.getElementById('app')!;

function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), props);
  for (const c of children) node.append(c);
  return node;
}

function section(title: string, ...nodes: Node[]): HTMLElement {
  return h('section', {}, h('h2', { textContent: title }), ...nodes);
}

app.append(
  h('h1', { textContent: 'rootstock — capability playground' }),
  h('p', { className: 'sub', textContent: `target: ${rs.platform.target}` }),
);

// --- Detected capabilities ----------------------------------------------------
const caps = rs.platform.capabilities as unknown as Record<string, unknown>;
const kv = h('div', { className: 'kv' });
for (const [name, value] of Object.entries(caps)) {
  kv.append(
    h('code', { textContent: name }),
    h('span', { className: value ? 'ok' : 'no', textContent: String(value) }),
  );
}
app.append(section('Detected capabilities', kv));

// --- Dialog + notifications ---------------------------------------------------
app.append(section('Dialog & notifications', h('div', { className: 'row' },
  rs.ui.button({
    label: 'Confirm…', variant: 'filled',
    onClick: async () => {
      const ok = await rs.dialog.confirm('Apply this change?', { title: 'Confirm' });
      await rs.notify.show({ body: ok ? 'Confirmed' : 'Cancelled', level: ok ? 'success' : 'info' });
    },
  }),
  rs.ui.button({
    label: 'Prompt…', variant: 'outlined',
    onClick: async () => {
      const name = await rs.dialog.prompt('Your name?', 'scion');
      if (name != null) await rs.notify.show({ body: `Hello, ${name}`, level: 'info' });
    },
  }),
  rs.ui.button({
    label: 'Notify', variant: 'text',
    onClick: () => rs.notify.show({ title: 'Saved', body: 'Workspace persisted', level: 'success', timeoutMs: 2500 }),
  }),
)));

// --- Theme --------------------------------------------------------------------
const themes = rs.theme.list();
const themeRow = h('div', { className: 'row' },
  rs.ui.select({
    value: rs.theme.current(),
    choices: themes.map((t) => ({ value: t.id, label: t.label })),
    onChange: (id) => rs.theme.set(id),
  }),
  rs.ui.button({ label: 'A/B toggle', variant: 'outlined', onClick: () => rs.theme.toggleSlot() }),
);
app.append(section(`Theme (${themes.length} presets)`, themeRow));

// --- Component layer ----------------------------------------------------------
app.append(section('Component layer (native fallback)', h('div', { className: 'row' },
  rs.ui.toggle({ label: 'Enabled', checked: true, onChange: (c) => rs.notify.show({ body: `toggle: ${c}`, level: 'info' }) }),
  rs.ui.slider({ min: 0, max: 100, value: 40, onInput: () => {} }),
  rs.ui.textInput({ placeholder: 'Type…', onInput: () => {} }),
)));

// Signal a clean boot for the headless smoke test.
(window as unknown as Record<string, unknown>).__rootstockReady = true;
