# Verified DOM hooks (OpenCode Desktop, builds of Oct 31 → Nov 7 2026)

These were extracted from the installed app's renderer bundle
(`/Applications/OpenCode.app/Contents/Resources/app.asar`, `out/renderer/assets/main-*.css|js`).
They are **not a documented stable API** — re-verify with
`../scripts/asar_pull.mjs` after any app update.

## Markdown rendering

| Hook | Meaning |
|---|---|
| `[data-component=markdown]` | Markdown container (assistant text, tool output markdown, reasoning, preview panels) |
| `[data-markdown-block]` | Block wrapper div inside the container (headings/paragraphs may be nested one level deeper — use `:has()` for sibling relations) |
| `[data-markdown-word]` / `[data-markdown-enter]` | Streaming word spans (inline, animated entry) |
| `[data-component=markdown-code]` | Fenced-code wrapper; `position: relative`; carries `data-language` (e.g. `typescript`) and `data-code-kind=shell` for shell blocks; inner `code` gets class `language-<lang>`; contains `pre` + `[data-slot=markdown-copy-button]` |
| `[data-component=markdown-table]` | Table wrapper (border/box-shadow live here; `table` inside) |
| `[data-component=markdown-mermaid]` | Mermaid render target |
| `[data-slot=markdown-copy-button]` | Copy button, top-right, opacity on hover |
| `code[data-inline-code-kind=path]` | Inline path chips (file references) — app keeps them chrome-less |
| `a.external-link > code[data-inline-code-kind=url]` | Link-URL code — app underlines it |
| `li > input[type=checkbox]`, `li > p > input[type=checkbox]` | Task-list checkboxes (absolutely positioned, `inset-inline-start: -20px`) |

## Special markdown surfaces (style these deliberately, not accidentally)

| Hook | App behavior to respect |
|---|---|
| `[data-component=reasoning-part] [data-component=markdown]` | Thinking blocks: app forces 13px, muted color, `font-size: inherit` headings for h2–h6 (higher specificity than a plain `[data-component=markdown] h*` rule). Recommendation: strip heading shadows, keep it quiet. |
| `[data-component=tool-output] [data-component=markdown] pre` | App forces `background-color: transparent !important; border: none !important; margin/padding: 0`. Do not fight it — neutralize your own box-shadow/chip there too. |

## Theme application mechanics (from the JS, function `M1t`)

```js
documentElement.dataset.theme = t          // the THEME ID, e.g. "opencode-rizo-theme:rizo" — NOT "dark"!
documentElement.dataset.colorScheme = n    // "light" | "dark"  ← the dark-mode hook
documentElement.style.backgroundColor = r ? '#080808' : '#fafafa'
```

- Dark scheme selector to use: **`[data-color-scheme=dark]`** (on `<html>`).
  `.dark` survives only in ~3 legacy scrollbar rules; `[data-theme=dark]`
  never matches because `data-theme` holds a theme ID.
- The active theme is rendered into a dedicated `<style>` element as
  `:root { color-scheme: …; --text-mix-blend-mode: …; <palette vars> }`.

## Token architecture

Three layers of CSS custom properties:

1. **Ramps**: `--v2-grey-50…1200`, `--v2-blue-*`, `--v2-pink-*`, …
   (light values in `:root`; dark flips via `[data-color-scheme=dark]`)
2. **Semantic**: `--v2-text-text-*`, `--v2-background-bg-*`,
   `--v2-border-border-*`, `--v2-icon-icon-*`, `--v2-state-*` — defined in
   `:root` as `var()` references into the ramps
3. **Markdown vars** on `[data-component=markdown]`:
   `--markdown-inline-code-*`, `--markdown-shell-code-*` (consumed), plus
   `--markdown-heading/link/blockQuote/…` (theme-mapping keys, not all are
   consumed by CSS — don't rely on them for restyling)

Practical consequence: overriding semantic tokens directly (concrete colors,
under `:root` and `[data-color-scheme=dark]`) works and beats the cascade if
injected later; overriding ramps also works but is broader.

## Fonts

- Base vars: `--font-family-text` → `--font-family-sans` ("Inter"),
  `--font-family-mono` ("IBM Plex Mono"). The app sets both **inline** on
  `documentElement` (Settings › Appearance can override) — inline style beats
  stylesheet rules, so restyle fonts at the component level, not via these
  vars.
- KaTeX is bundled (`.katex`) for math.
