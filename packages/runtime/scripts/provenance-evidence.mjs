import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';

// A license/NOTICE filename is evidence of a file, not evidence of legal clearance.
export async function fingerprintNoticeFile(path, name) {
  const bytes = await readFile(path);
  return {
    name,
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex')
  };
}

export function verifyLockfileMatchesInstalled(scope, lock, installed) {
  if (!lock || lock.lockfileVersion !== 3 || !lock.packages ||
      typeof lock.packages !== 'object') {
    throw new Error('Invalid npm v3 lockfile candidate for ' + scope);
  }
  const mismatches = installed.filter(record => {
    const locked = lock.packages[record.installPath];
    return !locked || locked.version !== record.version;
  }).map(record => ({
    installPath: record.installPath,
    installedVersion: record.version,
    lockedVersion: lock.packages[record.installPath]?.version ?? null
  }));
  return {
    scope,
    lockfileVersion: lock.lockfileVersion,
    lockedEntries: Object.keys(lock.packages).length - 1,
    installedEntries: installed.length,
    mismatches
  };
}
