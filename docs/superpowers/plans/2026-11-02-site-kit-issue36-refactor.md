# Plan: Site Kit #36 defer optional toast registration

## Goal

Reduce cold-route startup work for the M0 Vanilla/React preview by deferring the
Web Awesome toast component until the user explicitly requests a notification.
Preserve the existing notification behavior, the optional i18next boundary, and
all public preview contracts. Stop without a code change if the measured result
does not improve startup bytes without a route regression.

## Architecture

The preview keeps Web Awesome page, button, breadcrumb, and breadcrumb-item
registration on the initial path because they render the visible shell. The
toast custom element is moved to an explicit user-action import in the Vanilla
host; the React host does not use the toast element and will not register it at
startup. The notification counter remains synchronous, while toast rendering is
queued behind one deduplicated dynamic import. Existing disposal and error
boundaries remain authoritative.

## Tech Stack

- Vite 6.2.3 and Rollup output in `spikes/m0`
- Node.js 26.12.1
- Web Awesome Core 3.14.0
- Playwright Chromium/WebKit browser tests
- Node test runner for package contract tests

## Spec

- Live `kinoko34077/devflow` Repository Control #714 and its canonical entries
- `kinoko34077/kinotch-site-kit` Issue #36 and related architecture Issue #32
- `docs/SPECIFICATION.md` and current `main` at `f4818aef5184ad92ba70bde575592abd9d8877bb`
- `.ai-guidelines` `REFACTORING_OPTIMIZATION_STANDARD.md` at blob
  `43831880a25d428cee82f5024f60acf9391f38bd`
- D1 diagnosis with L/E/P/S scope recorded in Issue #36
- G1: existing notification, disposal, browser, and package contracts remain
  passing; toast appears after an explicit click.
- G2: full unit/browser suite remains green, no startup request regression, and
  no initial route gets larger.
- G3: cold-route `startupScriptPlusCssBytes` decreases by at least 1,024 bytes
  on one route, neither route increases, and the toast chunk is requested only
  after the explicit notification action.

## Global Constraints

- Fetch and compare against the exact live `origin/main` before implementation.
- Use the existing optional-loader pattern; do not add a provider, permission,
  credential, deployment, or consumer migration.
- Test-first: add a failing characterization/performance assertion before
  changing production code.
- Keep the change isolated and reversible; do not rewrite unrelated generated
  artifacts or the already accepted CSS optimization.
- Record baseline, change, test evidence, residual unverified conditions, and
  rollback/merge status on Issue #36 and its PR.

## Review Focus

- Confirm the initial dependency graph no longer registers `wa-toast`.
- Confirm concurrent notification clicks share one dynamic import and preserve
  notification count/order.
- Confirm page disposal during import does not create a toast or leak handlers.
- Compare exact-head before/after route bytes and request traces under the same
  Node/browser/build conditions.
- Keep independent review, CI, integration, and any public Pages verification
  separate; do not treat local build/test success as release acceptance.
