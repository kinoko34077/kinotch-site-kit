import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fingerprintNoticeFile,verifyLockfileMatchesInstalled} from '../scripts/provenance-evidence.mjs';

test('license file evidence fingerprints real content without interpreting its obligations', async () => {
  const dir = await mkdtemp(join(tmpdir(),'site-kit-notice-'));
  try {
    await writeFile(join(dir,'LICENSE'),'example license text\n');
    const e = await fingerprintNoticeFile(join(dir,'LICENSE'),'LICENSE');
    assert.equal(e.name,'LICENSE');
    assert.equal(e.bytes,21);
    assert.match(e.sha256,/^[a-f0-9]{64}$/);
  } finally { await rm(dir,{recursive:true,force:true}); }
});

test('lock audit compares physical install paths including nested versions', () => {
  const installed=[
    {installPath:'node_modules/a',version:'1.0.0'},
    {installPath:'node_modules/a/node_modules/b',version:'2.0.0'}
  ];
  const lock={lockfileVersion:3,packages:{'':{},
    'node_modules/a':{version:'1.0.0'},
    'node_modules/a/node_modules/b':{version:'2.0.0'}}};
  const ok=verifyLockfileMatchesInstalled('fixture',lock,installed);
  assert.equal(ok.mismatches.length,0);
  assert.equal(ok.installedEntries,2);
  const drift=verifyLockfileMatchesInstalled('fixture',lock,[...installed,{installPath:'node_modules/c',version:'3.0.0'}]);
  assert.deepEqual(drift.mismatches.map(x=>x.installPath),['node_modules/c']);
  assert.throws(()=>verifyLockfileMatchesInstalled('fixture',{lockfileVersion:2},installed),/Invalid npm v3/);
});
