# M0/M4 Installed dependency metadata inventory — partial evidence

Owner: [OSS/license #3](https://github.com/kinoko34077/kinotch-site-kit/issues/3), [release QA #9](https://github.com/kinoko34077/kinotch-site-kit/issues/9), [M4 distribution #8](https://github.com/kinoko34077/kinotch-site-kit/issues/8). Snapshot scope: actual CI-installed direct **and transitive** packages for `packages/runtime`, `packages/features`, and `spikes/m0`.

The read-only audit `node packages/runtime/scripts/audit-dependency-metadata.mjs` runs **after** the CI's existing npm installs. It walks installed nested `node_modules`, records only package name, version, package.json `license` field and probable LICENSE/COPYING/NOTICE/THIRD_PARTY file **names**; it does **not** inspect secrets or copy package source/notice contents. The resulting `packages/runtime/artifacts/dependency-license-report.json` is uploaded for 14 days as `site-kit-dependency-license-evidence` and prints a short summary.

States are deliberately distinct:

| Field | What it establishes | What it does NOT establish |
|---|---|---|
| package name+version | One installed CI dependency graph snapshot | Locked or reproducible transitive versions |
| package.json license metadata | A candidate SPDX/license descriptor to investigate | Actual license grant, Pro/Core entitlement or compatibility |
| candidate notice filenames | Presence of probable license or attribution files | Completeness/accuracy of required bundled notice texts |
| unresolved list | A mechanical list of missing metadata / likely notices | Verified license violation or approval |

**Release remains blocked** until actual relevant package license and NOTICE texts, allowed free-tier features, transitive obligations/attribution, SBOM completeness, immutable dependency locks, and compatibility are verified in owning #3/#9; this audit does not automatically close either. The packaging proof remains unreleased and no production consumer, permissions, auth, external provider or deployment is modified.

Do not interpret `npm install --no-package-lock` plus pinned direct versions as guaranteeing transitive reproducibility; that gap is explicit and actionable. The next precise milestone is frozen dependency graph/lockfiles and actual notice-text classification of the reported unresolved items, rather than a generic declaration that all licenses are acceptable.

## 2026-10-20 continuation: candidate lock + exact file fingerprints (not legal approval)

The optional-runtime CI now performs `npm install` to create three candidate `package-lock.json` files, then `npm ci` on each before evidence collection. The complete candidate locks are retained as the 14-day artifact `site-kit-transitive-lock-candidates` so their **exact installed transitive graph** can be reviewed and later committed separately. The metadata scanner verifies every discovered installed package path/version against the generated lock and records each candidate lock SHA-256. Root-level candidate LICENSE/COPYING/NOTICE file **bytes are read and fingerprinted** (name, byte length, SHA-256) rather than merely recording names. A native fixture test checks SHA generation and nested lock-path mismatch detection.

**Non-acceptance boundary:** CI-generated lockfiles are not yet checked into Git; their hashes are not a permanent cross-run pin. The seven unresolved packages require actual legal text provenance, notice/attribution obligations and inclusion decisions. Fingerprinting a file, even with a license descriptor, does not interpret or clear those obligations. This evidence change does not publish npm, change consumer sites, or request new credentials.
