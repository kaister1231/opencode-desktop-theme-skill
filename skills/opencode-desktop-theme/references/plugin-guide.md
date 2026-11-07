# GUI plugin guide (appearance-focused)

Official docs: <https://opencode.ai/docs/build/plugins/gui> (marked
experimental — exports can change between releases). This guide adds the
zero-dependency path and the pitfalls verified in practice.

## Two build paths

### A. Zero-dependency (no npm needed — good when npm/bun is unavailable)

The loader for a local directory: if `package.json` has `name` + `exports`,
it resolves `./gui-experimental` through them; otherwise it loads
`gui-experimental.cjs` (or `.js`) at the directory root. Entry must be `.cjs`
or `.js`. No `package.json` at all → root file is used and the plugin ID is
the directory name.

Emit the bundle with plain Node:

```js
// build.mjs — run: node build.mjs
import fs from "node:fs"
import path from "node:path"

const root = new URL(".", import.meta.url).pathname
const css = fs.readFileSync(path.join(root, "src/theme.css"), "utf8")
const theme = JSON.parse(fs.readFileSync(path.join(root, "theme.json"), "utf8"))

fs.writeFileSync(path.join(root, "gui-experimental.cjs"), `"use strict";
const { Plugin, Style, Theme } = require("@opencode/plugin/gui");
const CSS = ${JSON.stringify(css)};
const THEME = ${JSON.stringify(theme)};
module.exports = Plugin.define({
  setup(ctx) {
    ctx.add(Style, CSS);
    if (Theme) ctx.add(Theme, THEME);   // feature-detect: older builds lack Theme
  },
});
`)
```

Fonts: inline as base64 data URLs in the CSS (rewrite `url(x.woff2)` to
`url(data:font/woff2;base64,…)` in the build script). ~500 KB of woff2 is
fine for Electron.

### B. Vite (official preset)

`package.json` with `"exports": { "./gui-experimental": "./dist/gui-experimental.cjs" }`,
devDeps `vite vite-plugin-solid solid-js`, dep `@opencode/plugin` (types only —
the app provides the runtime module):

```ts
// vite.config.ts
import { defineConfig } from "vite"
import { gui } from "@opencode/plugin/gui/vite"

export default defineConfig({ plugins: [gui()] })
```

`src/gui.tsx` default-exports `Plugin.define`; import CSS with
`./file.css?inline`. The preset emits one CJS file, inlines dynamic imports,
keeps `effect`, `solid-js`, `@opencode/*`, Electron, and Node builtins
external. Build: `vite build` (use `--watch` while iterating).

## Registration

Desktop reads plugins from **global `opencode.json(c)` only**
(`~/.config/opencode/opencode.json(c)`) — never from `cli.json` (that is the
TUI's file):

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["/absolute/path/to/plugin-dir"]
}
```

Reload semantics (verified):

- **New plugin registration**: requires fully quitting and reopening the app.
- **Rebuild of a registered local plugin**: hot-reloads the GUI in every
  window, no restart.
- Changing the plugin's `options` in config also reloads it.
- Status + per-plugin GUI toggle: Settings › Extensions › Plugins.

## Theme JSON format

```json
{
  "$schema": "https://opencode.ai/desktop-theme.json",
  "name": "Display Name",
  "id": "kebab-id",
  "light": { "palette": { }, "overrides": { } },
  "dark":  { "palette": { }, "overrides": { } }
}
```

- Each variant starts from `palette` **or** `seeds` (never both); `overrides`
  pins single tokens.
- **Palette keys — all 10** (the app's own `oc-2` theme defines 10; docs
  examples show 7 and miss the last three):
  `neutral, ink, primary, success, warning, error, info, interactive,
  diffAdd, diffDelete`.
- `overrides` token names observed in the build: `syntax-keyword`,
  `syntax-string`, `syntax-comment`, `syntax-constant`, `syntax-primitive`,
  `syntax-type`, `syntax-object`, `syntax-variable`, `syntax-property`,
  `syntax-operator`, `syntax-punctuation`, `syntax-regexp`, `syntax-info`,
  `syntax-critical`, `syntax-success`, `syntax-warning`, `syntax-diff-add`,
  `syntax-diff-delete`, `syntax-diff-unknown`.
- The host keys contributed themes as `<plugin id>:<theme id>`; the picker
  sorts by `name`; withdrawing the theme removes it while users who picked it
  keep the choice until it returns.

## Export map drift (why `ctx.add` can crash)

The GUI SDK's exports are build-dependent. Example: the Oct 31 2026 build
exported `Command, ComposerPill, Contract, Ipc, LinkHandler, MenuItem, Panel,
Plugin, Registry, Server, SettingsPage, Slot, Store, Style, TitlebarItem,
bindPlugin, createKeyed, createLatest, createVisitState, useDrawer,
usePanel, usePlugin` — **no `Theme`**. Passing `undefined` as a registry to
`ctx.add` throws `TypeError: Cannot read properties of undefined (reading
'id')`. Fix: feature-detect every optional contribution (`if (Theme) …`).
Check a build's actual exports via `../scripts/asar_pull.mjs`: pull the
renderer `main-*.js` and grep `var \w+=e\(\{Command:`.

## CSS pitfalls

- Scope everything under the markdown container; a bare `h1 { … }` repaints
  the whole UI.
- Headings-after-heading rhythm: the app zeroes `margin-top` of blocks
  following headings — port spacing via heading `margin-bottom`.
- Sibling selectors like `h1 + p` may not fire because blocks are wrapped in
  `[data-markdown-block]`; add a `:has()` variant:
  `[data-markdown-block]:has(> h1) + [data-markdown-block] > p:first-child`.
- Language chips: attach `::before` to `[data-component=markdown-code]`
  (it is `position: relative` and carries `data-language`), not to `pre`.
- Reasoning and tool-output surfaces need explicit neutralizers — see
  `dom-hooks.md`.
