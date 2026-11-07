# App.asar introspection (verify hooks on any build)

The app is Electron; its renderer is plain text inside
`/Applications/OpenCode.app/Contents/Resources/app.asar` (paths differ on
Windows/Linux). The asar container stores files uncompressed after a JSON
header, so a 40-line Node script reads everything without installing
`@electron/asar` (whose npm install may fail behind corporate TLS
interception anyway).

## Tool

`../scripts/asar_pull.mjs` — zero-dependency:

```sh
# list renderer assets
node asar_pull.mjs /Applications/OpenCode.app/Contents/Resources/app.asar list 'out/renderer/assets/main-'

# extract files (written next to cwd as pulled-<basename>)
node asar_pull.mjs <asar> pull /out/renderer/assets/main-XXXX.js /out/renderer/assets/main-YYYY.css
```

Re-run after every app update; bundle hashes (`main-DH32_HOX.js`,
`main-riyX3xdz.js`, …) change.

## What to check, in order

1. **GUI SDK exports** (does this build have `Theme`? `Style`?):
   grep the renderer `main-*.js` for the module map:

   ```
   var <name>=e({Command:…,Style:…,Theme:…})
   ```

   The key list after `e({` is exactly what `require("@opencode/plugin/gui")`
   provides. Missing export + `ctx.add(undefined, …)` is the classic
   `reading 'id'` crash.

2. **Theme application + scheme hook**: grep for
   `documentElement.dataset` — you will find

   ```js
   dataset.theme = <themeId>; dataset.colorScheme = <"light"|"dark">
   ```

   Use `data-color-scheme` for dark overrides; never `[data-theme=dark]`.

3. **Markdown DOM hooks**: grep the `main-*.css` for rules containing
   `data-component=markdown` (container, code, table, reasoning-part,
   tool-output, copy button, checkbox positions). This is the ground truth
   for selector retargeting.

4. **Theme registry mechanics**: grep `theme.registered` (plugin themes are
   merged into the themes map, keyed `<plugin id>:<theme id>`),
   `registerTheme(`, and the default theme literal (`id:` `oc-2`) whose
   palette reveals the canonical key set.

5. **Palette derivation**: the default theme object near
   `$schema: https://opencode.ai/desktop-theme.json` shows required palette
   keys (`neutral, ink, primary, success, warning, error, info, interactive,
   diffAdd, diffDelete`).

## Asar format notes (if the script needs adapting)

- Bytes 0–7: pickle header; `UInt32LE` at offset 4 = header pickle length `S`.
- Header pickle: `UInt32LE` at offset 4 of the buffer = JSON string length;
  JSON starts at buffer offset 8. Parse with `JSON.parse` → node tree.
- File data begins at offset `8 + S`; each file entry stores `offset`
  (relative to that), `size`, and `unpacked` (those live in
  `app.asar.unpacked/` on disk instead).
