'use strict';

// @exodus/bytes is ESM-only but several packages still use require() to load it,
// crashing in CJS environments (Vercel Lambda). This script patches each known
// occurrence with an inline CJS-compatible stub.
//
// Patched files:
//   1. jsdom/lib/api.js          — requires legacyHookDecode from @exodus/bytes/encoding.js
//   2. whatwg-url url-state-machine.js — requires @exodus/bytes/encoding.js + /whatwg.js
//
// Run automatically via postinstall.

const fs   = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'node_modules');

let patched = 0;

// ── 1. Patch jsdom/lib/api.js ─────────────────────────────────────────────────
function patchJsdom() {
  const target = path.join(root, 'jsdom', 'lib', 'api.js');
  if (!fs.existsSync(target)) return;

  let src = fs.readFileSync(target, 'utf-8');
  if (src.includes('// patch-exodus-bytes: jsdom done')) return;
  if (!src.includes('@exodus/bytes/encoding.js')) return;

  // legacyHookDecode(bytes, encoding) decodes a Uint8Array to string.
  // We only need it when jsdom receives raw bytes (not our string-based path),
  // so a TextDecoder stub covering UTF-8 and labelled encodings is sufficient.
  src = src.replace(
    `const { legacyHookDecode } = require("@exodus/bytes/encoding.js");`,
    `// patch-exodus-bytes: jsdom done — inline legacyHookDecode (replaces @exodus/bytes/encoding.js)
function legacyHookDecode(bytes, encoding) {
  try {
    return new TextDecoder(encoding || 'utf-8', { fatal: false }).decode(bytes);
  } catch {
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  }
}`,
  );

  fs.writeFileSync(target, src);
  console.log('patch-exodus-bytes: patched jsdom/lib/api.js');
  patched++;
}

// ── 2. Patch all whatwg-url/lib/url-state-machine.js instances ───────────────
function findUrlStateMachines(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== '.bin') {
      findUrlStateMachines(full, results);
    } else if (entry.name === 'url-state-machine.js' && full.includes('whatwg-url')) {
      results.push(full);
    }
  }
  return results;
}

function patchWhatwgUrl() {
  for (const target of findUrlStateMachines(root)) {
    let src = fs.readFileSync(target, 'utf-8');
    if (src.includes('// patch-exodus-bytes: whatwg-url done')) continue;
    if (!src.includes('@exodus/bytes')) continue;

    src = src.replace(
      /^require\("@exodus\/bytes\/encoding\.js"\);.*$/m,
      '// @exodus/bytes/encoding.js removed — ESM-only (patch-exodus-bytes.js)',
    );
    src = src.replace(
      /^const \{ percentEncodeAfterEncoding \} = require\("@exodus\/bytes\/whatwg\.js"\);.*$/m,
      '// @exodus/bytes/whatwg.js removed — ESM-only (patch-exodus-bytes.js)',
    );

    const anchor = /isPathPercentEncode,\s+isUserinfoPercentEncode\s*\}\s*=\s*require\("\.\/percent-encoding"\);/;
    if (!anchor.test(src)) {
      console.warn('patch-exodus-bytes: could not find anchor in', target, '— skipping');
      continue;
    }

    src = src.replace(anchor, (m) =>
      m + `\n// patch-exodus-bytes: whatwg-url done — UTF-8-only percentEncodeAfterEncoding
function percentEncodeAfterEncoding(encoding, input, percentEncodeSet, spaceAsPlus = false) {
  return utf8PercentEncodeString(input, percentEncodeSet, spaceAsPlus);
}`
    );

    fs.writeFileSync(target, src);
    console.log('patch-exodus-bytes: patched', target);
    patched++;
  }
}

patchJsdom();
patchWhatwgUrl();

if (patched === 0) {
  console.log('patch-exodus-bytes: all files already clean, nothing to do.');
}
