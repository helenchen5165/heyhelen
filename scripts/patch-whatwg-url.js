'use strict';

// whatwg-url v14.0.x uses require("@exodus/bytes/...") but @exodus/bytes is ESM-only,
// crashing in CJS environments (Vercel Lambda). v14.2.0+ removed this dependency.
//
// This patch is a safety net: it finds every url-state-machine.js that still has the
// broken @exodus/bytes require and replaces it with an inline UTF-8-only implementation
// using whatwg-url's own ./percent-encoding.js (CJS).
//
// The root fix is "overrides": { "whatwg-url": "14.2.0" } in package.json; this script
// only triggers when that override is somehow bypassed (e.g., Vercel hoisting edge cases).
//
// Run automatically via postinstall.

const fs   = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'node_modules');

// Collect all url-state-machine.js files under node_modules
function findTargets(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== '.bin') {
      findTargets(full, results);
    } else if (entry.name === 'url-state-machine.js' && full.includes('whatwg-url')) {
      results.push(full);
    }
  }
  return results;
}

const targets = findTargets(root);

if (targets.length === 0) {
  console.log('patch-whatwg-url: no url-state-machine.js found, skipping.');
  process.exit(0);
}

let patched = 0;
for (const target of targets) {
  let src = fs.readFileSync(target, 'utf-8');

  // Skip if already patched or has no @exodus/bytes
  if (src.includes('// patch-whatwg-url: done')) continue;
  if (!src.includes('@exodus/bytes')) continue;

  // Remove the @exodus/bytes side-effect require (registers legacy multi-byte encodings)
  src = src.replace(
    /^require\("@exodus\/bytes\/encoding\.js"\);.*$/m,
    '// @exodus/bytes/encoding.js removed — ESM-only (patch-whatwg-url.js)',
  );

  // Remove the @exodus/bytes/whatwg.js require (provides percentEncodeAfterEncoding)
  src = src.replace(
    /^const \{ percentEncodeAfterEncoding \} = require\("@exodus\/bytes\/whatwg\.js"\);.*$/m,
    '// @exodus/bytes/whatwg.js removed — ESM-only (patch-whatwg-url.js)',
  );

  // Inject a UTF-8-only percentEncodeAfterEncoding after the existing
  // require("./percent-encoding") block that already exports utf8PercentEncodeString.
  const anchor = /isPathPercentEncode,\s+isUserinfoPercentEncode\s*\}\s*=\s*require\("\.\/percent-encoding"\);/;
  if (!anchor.test(src)) {
    console.warn('patch-whatwg-url: could not find injection anchor in', target, '— skipping.');
    continue;
  }

  src = src.replace(anchor, (m) =>
    m + `\n// patch-whatwg-url: done — UTF-8-only percentEncodeAfterEncoding (replaces @exodus/bytes/whatwg.js)
function percentEncodeAfterEncoding(encoding, input, percentEncodeSet, spaceAsPlus = false) {
  return utf8PercentEncodeString(input, percentEncodeSet, spaceAsPlus);
}`
  );

  fs.writeFileSync(target, src);
  console.log('patch-whatwg-url: patched', target);
  patched++;
}

if (patched === 0) {
  console.log('patch-whatwg-url: all files already clean (v14.2.0+), nothing to do.');
}
