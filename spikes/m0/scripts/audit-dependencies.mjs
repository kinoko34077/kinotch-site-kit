// Evidence-only M0 dependency inventory. NEVER an automatic license approval.
// Reads installed package metadata and npm-generated package-lock; no network/credentials.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, sep } from 'node:path';

const lockPath = resolve('package-lock.json');
const content = await readFile(lockPath);
const lock = JSON.parse(content.toString('utf8'));
if (![2, 3].includes(lock.lockfileVersion) || !lock.packages) {
  throw new Error('Unexpected npm package lock format');
}

const allowListed = new Set([
  'MIT', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0',
  '0BSD', 'CC0-1.0', 'Unlicense'
]);
// This is triage, not complete license-expression parsing or a legal decision.
const records = [];
for (const [location, metadata] of Object.entries(lock.packages)) {
  if (!location || !location.includes('node_modules/')) continue;
  if (location.includes('..') || location.startsWith('/') || location.includes('\\')) {
    throw new Error('Unexpected lockfile package location: ' + location);
  }
  const dir = resolve(location);
  if (!dir.startsWith(resolve('node_modules') + sep) && !location.startsWith('node_modules/')) {
    throw new Error('Unexpected dependency location: ' + location);
  }
  let installed = null;
  try {
    installed = JSON.parse(await readFile(resolve(dir, 'package.json'), 'utf8'));
  } catch {
    // Some optional/OS-specific dependencies are absent on this runner.
  }
  const value = installed?.license ?? metadata.license ?? null;
  const license = typeof value === 'string' ? value : (value == null ? '' : JSON.stringify(value));
  const version = installed?.version ?? metadata.version ?? '';
  const declaredName = installed?.name ?? location.slice(location.lastIndexOf('node_modules/') + 13);
  const state = !license ? 'UNKNOWN' : allowListed.has(license) ? 'CANDIDATE_PERMISSIVE' : 'REQUIRES_REVIEW';
  records.push({ name: declaredName, version, location, license, state, installed: !!installed });
}
records.sort((a, b) => a.location.localeCompare(b.location));

// Keep the adapter's exactly required TanStack core as one physical module.
// A second copy might create distinct hotkey managers/listener bookkeeping.
const coreHotkeys=records.filter(x=>x.name==='@tanstack/hotkeys'&&x.installed);
if(coreHotkeys.length!==1||coreHotkeys[0].version!=='0.11.0'||
  coreHotkeys[0].location!=='node_modules/@tanstack/hotkeys'){
  throw new Error('Expected one hoisted @tanstack/hotkeys@0.11.0; observed: '+
    JSON.stringify(coreHotkeys.map(x=>({path:x.location,version:x.version}))));
}
console.log('TANSTACK_HOTKEYS_SINGLE_CORE',JSON.stringify({
  coreVersion:coreHotkeys[0].version,installedCopies:coreHotkeys.length,
  reactAdapter:'0.13.0'
}));
const count = status => records.filter(x => x.state === status).length;
const data = {
  kind: 'm0-inventory-not-license-approval',
  lock_sha256: createHash('sha256').update(content).digest('hex'),
  npm_lockfile_version: lock.lockfileVersion,
  node: process.version,
  totals: {
    all: records.length,
    candidatePermissive: count('CANDIDATE_PERMISSIVE'),
    requiresReview: count('REQUIRES_REVIEW'),
    unknown: count('UNKNOWN')
  },
  caveats: [
    'Metadata-only classification is NOT legal review or bundled-license approval.',
    'SPDX composites, NOTICE requirements, copied assets and optional OS packages need manual verification.',
    'This temporary npm lockfile is evidence for this single install and NOT committed reproducible production pins.',
    'Web Awesome Core-vs-Pro assets must be separately inspected by version and actual bundle.'
  ],
  packages: records
};
await mkdir('artifacts', { recursive: true });
await writeFile('artifacts/m0-dependency-inventory.json', JSON.stringify(data, null, 2) + '\n');
console.log('M0_DEPENDENCY_INVENTORY', JSON.stringify({
  sha256: data.lock_sha256, ...data.totals
}));
for (const record of records.filter(x => x.state !== 'CANDIDATE_PERMISSIVE')) {
  console.log('M0_LICENSE_REVIEW', JSON.stringify(record));
}
console.log('M0_DEPENDENCY_INVENTORY_IS_NOT_ACCEPTANCE');
