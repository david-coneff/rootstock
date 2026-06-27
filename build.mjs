#!/usr/bin/env node
/*
 * build.mjs — rootstock single-file demo build (rhiz-Partition modality B / DS-002).
 *
 * rootstock's product is an npm library (built with tsup → dist/), but it also
 * ships a "core HTML": a capability playground that boots rootstock/web in a
 * real browser. This rolls the modular examples/playground/ source up into ONE
 * self-contained examples/playground.html — the same esbuild roll-up the scion
 * apps (docket, tessel) use, so every project shares one build process.
 *
 *     node build.mjs            # one-shot
 *     node build.mjs --watch    # rebuild on change
 *
 * The library packaging (tsup) is untouched; this only adds the HTML demo.
 */
import { build, context } from 'esbuild';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url));
const ENTRY = resolve(ROOT, 'examples/playground/main.ts');
const SHELL = resolve(ROOT, 'examples/playground/index.html');
const OUT = resolve(ROOT, 'examples/playground.html');
const watch = process.argv.includes('--watch');

const BANNER = `<!--\n  GENERATED FILE — do not edit by hand.\n  Source of truth: examples/playground/ (modular TS + CSS). Rebuild: node build.mjs\n  Single-file roll-up per rhiz-Partition modality B (DS-002).\n-->\n`;

/*
 * The library source uses NodeNext-style explicit `.js` import specifiers that
 * actually point at `.ts` files (the tsc/tsup convention). Raw esbuild does not
 * remap those, so this resolver rewrites a relative `*.js` import to its `*.ts`
 * sibling when one exists — letting the demo bundle straight from src/ with no
 * prior tsup build.
 */
const tsJsResolve = {
  name: 'ts-js-resolve',
  setup(b) {
    b.onResolve({ filter: /\.js$/ }, (args) => {
      if (args.kind === 'entry-point' || !args.path.startsWith('.')) return undefined;
      const ts = resolve(args.resolveDir, args.path.replace(/\.js$/, '.ts'));
      return existsSync(ts) ? { path: ts } : undefined;
    });
  },
};

const options = {
  entryPoints: [ENTRY],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2022',
  charset: 'utf8',
  legalComments: 'none',
  write: false,
  outdir: resolve(ROOT, 'examples/.build'),
  loader: { '.svg': 'text' },
  plugins: [tsJsResolve],
};

function emit(outputFiles) {
  let js = '';
  let css = '';
  for (const f of outputFiles) {
    if (f.path.endsWith('.js')) js = f.text;
    else if (f.path.endsWith('.css')) css = f.text;
  }
  const safeJs = js.replace(/<\/script>/gi, '<\\/script>');
  const safeCss = css.replace(/<\/style>/gi, '<\\/style>');

  let html = readFileSync(SHELL, 'utf8');
  if (safeCss) html = html.replace('</head>', `  <style>${safeCss}</style>\n</head>`);
  html = html.replace('</body>', `  <script>${safeJs}</script>\n</body>`);
  html = BANNER + html;

  writeFileSync(OUT, html);
  console.log(`examples/playground.html written — ${Math.round(Buffer.byteLength(html) / 1024)} KB (self-contained, file://-ready)`);
}

if (watch) {
  const ctx = await context({ ...options, plugins: [...options.plugins, {
    name: 'inline-html',
    setup(b) { b.onEnd((r) => { if (r.outputFiles) emit(r.outputFiles); }); },
  }] });
  await ctx.watch();
  console.log('watching examples/playground/ — rebuilding on change …');
} else {
  const result = await build(options);
  emit(result.outputFiles);
}
