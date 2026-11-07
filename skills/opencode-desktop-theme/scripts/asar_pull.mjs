#!/usr/bin/env node
// Zero-dependency OpenCode app.asar inspector.
//
//   node asar_pull.mjs <app.asar> list <substring>      list files whose path contains substring
//   node asar_pull.mjs <app.asar> pull <path> [more…]   extract files to ./pulled-<basename>
//
// Works on macOS/Linux/Windows asar layouts; unpacked files are reported,
// not extracted (they live in app.asar.unpacked on disk).
import fs from "node:fs"
import path from "node:path"

const [asarPath, cmd, ...args] = process.argv.slice(2)
if (!asarPath || !cmd) {
  console.error("usage: node asar_pull.mjs <app.asar> list <substring> | pull <path> [...]")
  process.exit(1)
}

const fd = fs.openSync(asarPath, "r")

// --- asar header -----------------------------------------------------------
// bytes 0..7 pickle: UInt32LE@4 = header pickle length S.
// header pickle: UInt32LE@4 = JSON string length; JSON starts at buffer offset 8.
const sizeBuf = Buffer.alloc(8)
fs.readSync(fd, sizeBuf, 0, 8, 0)
const headerLen = sizeBuf.readUInt32LE(4)
const headerBuf = Buffer.alloc(headerLen)
fs.readSync(fd, headerBuf, 0, headerLen, 8)
const jsonLen = headerBuf.readUInt32LE(4)
const header = JSON.parse(headerBuf.toString("utf8", 8, 8 + jsonLen))
const dataOffset = 8 + headerLen

function walk(node, dir, out = []) {
  if (node.files) {
    for (const [name, child] of Object.entries(node.files)) walk(child, `${dir}/${name}`, out)
  } else {
    out.push({ path: dir, size: node.size, offset: node.offset, unpacked: !!node.unpacked })
  }
  return out
}
const files = walk(header, "")

if (cmd === "list") {
  const needle = args[0] ?? ""
  for (const f of files) if (f.path.includes(needle)) console.log(`${String(f.size).padStart(9)}  ${f.path}${f.unpacked ? "  [unpacked]" : ""}`)
} else if (cmd === "pull") {
  for (const want of args) {
    const f = files.find((x) => x.path === want)
    if (!f) { console.error(`NOT FOUND: ${want}`); continue }
    if (f.unpacked) { console.error(`UNPACKED (fetch from app.asar.unpacked): ${want}`); continue }
    const buf = Buffer.alloc(f.size)
    fs.readSync(fd, buf, 0, f.size, dataOffset + Number(f.offset))
    const out = `pulled-${path.basename(want)}`
    fs.writeFileSync(out, buf)
    console.log(`${out}  (${f.size} bytes)`)
  }
} else {
  console.error(`unknown command: ${cmd}`)
  process.exit(1)
}
