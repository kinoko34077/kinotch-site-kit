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
