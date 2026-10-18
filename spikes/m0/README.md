# M0 isolated OSS composition spike — NOT the Site Kit implementation

Owner: [Issue #3](https://github.com/kinoko34077/kinotch-site-kit/issues/3). Standalone Vite 6/React 19/vanilla fixture, with references pinned to Web Awesome Core 3.14.0 and TanStack Hotkeys 0.13.0 alpha. Separate HTML entries: `index.html` vanilla, `react.html` React. Tests verify real custom element registration/Toast import, minimal theme switch and keyboard recorder, React-owned count and disposal. **These smoke tests do not certify production usability, WCAG compliance, complete keyboard conflict protection or physical iPhone behavior**.

Run with `npm install --no-audit --no-fund` then `npx playwright install chromium --with-deps` and `npm run test:e2e`. Frozen production lockfile is not yet established; dependency installation is intentionally isolated to this M0 spike. The CI workflow contains no credentials and runs on standard public-repo GitHub runner; it neither publishes nor changes consumer sites. Capture exact install tree, browser version and test failures in #3. First verify this CI path is functioning before marking any M0 acceptance gates.

Web Awesome wa-page does not create semantic HTML landmarks by itself; fixtures explicitly supply header/nav/main/footer. Note that `wa-toast` moved to **Core in 3.11.0**, confirmed by the [official changelog](https://webawesome.com/docs/resources/changelog); no Pro import is intended.

A failing test means inspect the exact upstream API/DOM at the pinned version and correct the fixture or reject the vendor with evidence. Do not weaken user UX acceptance conditions to force a PASS.
