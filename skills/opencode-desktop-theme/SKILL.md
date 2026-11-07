---
name: OpenCode Desktop Theme
description: Create, port, or debug OpenCode Desktop appearance — GUI plugin Style/Theme contributions, markdown CSS, desktop-theme.json palettes, plugin scaffolding and registration, and DOM-hook verification by introspecting the installed app's app.asar. Use when the user wants to customize the Desktop app's look, port a Typora/editor theme, restyle rendered markdown, or fix a desktop plugin or theme that fails to load or renders wrong.
---

# OpenCode Desktop theming

Methodology for restyling OpenCode Desktop (Electron GUI). Hard-won in
practice: every hook below was verified by extracting the installed app's
renderer bundle, not from docs alone. Hooks drift between releases — always
re-verify against the installed build before writing selectors.

## The mental model

Desktop has **no "install a theme file" entry**. Everything ships as a **GUI
plugin** that makes two independent contributions:

| Layer | Contribution | Controls | Activation |
|---|---|---|---|
| Theme | `ctx.add(Theme, themeJson)` | Colors only: chrome palette + syntax highlighting | User picks it in Settings › Appearance › Theme |
| Style | `ctx.add(Style, cssString)` | Typography: fonts, sizes, spacing, any CSS | Always on while the plugin loads |

Porting an editor theme (e.g. Typora `.css`): the typography goes to `Style`
with selectors retargeted to the app's DOM; the colors go to a `Theme` JSON.
Both fit in one plugin.

## Workflow

1. Read `references/plugin-guide.md` — scaffold, build, register, reload
   semantics, Theme JSON format, pitfalls.
2. Read `references/dom-hooks.md` — the verified DOM map and how the app
   applies themes internally.
3. **Verify the hooks against the installed app** with
   `scripts/asar_pull.mjs` (see `references/asar-introspection.md`). Do not
   trust the table blindly if the app updated recently.
4. Write the CSS scoped under the markdown container so app chrome is
   untouched. Port colors onto `--<prefix>-*` tokens with a light `:root`
   set and a dark override on `[data-color-scheme=dark]`.
5. Build, register in **global `opencode.json(c)`** (not `cli.json` — that is
   the TUI's), restart the app once for a brand-new plugin. Rebuilds after
   that hot-reload without restarting.
6. Verify in Settings › Extensions › Plugins; pick the theme in Appearance.

## Pitfalls that actually happened

- `TypeError: Cannot read properties of undefined (reading 'id')` in
  `ctx.add` → this app build lacks the export you passed (older builds had no
  `Theme`). Feature-detect: `if (Theme) ctx.add(Theme, json)`. Check the
  build's export map (`e({Command:…})`) via the asar script.
- Dark text unreadable while background is correct → the Style layer's dark
  token flip uses a stale hook. Current hook: `<html data-color-scheme=dark>`;
  `data-theme` holds the **theme ID**, not `dark`.
- Theme applies but some colors look default → `palette` is missing keys.
  The app's own theme uses 10 keys: `neutral, ink, primary, success, warning,
  error, info, interactive, diffAdd, diffDelete`.
- Styles leaking into the whole UI → selectors not scoped under
  `[data-component=markdown]`.

## Worked example

The methodology was validated end-to-end by porting the Typora theme
["rizo"](https://github.com/kcflan/rizo) — a two-ink risograph theme by
kcflan — to OpenCode Desktop: fonts inlined as base64, zero-dependency
build, `Style` + `Theme` contributions, light/dark palettes with full
10-key palettes and syntax overrides. The port itself is **not distributed
in this repo**: rizo's license forbids redistributing modified versions.
Keep your ports local — put the folder in `opencode.json(c)`'s `plugins`
and it works; only the skill ships here.
