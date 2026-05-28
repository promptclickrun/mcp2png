# Veritas Evidence: task_20260528_Vu7HfI

Task: Build `mcp2png` reusable package prototype.

## Location

`/Users/gordieai/.openclaw/workspace/apps/mcp2png`

## What was created

- TypeScript ESM package scaffold with `package.json`, `tsconfig.json`, `tsconfig.build.json`, Vitest configs, README, LICENSE, src, tests, and demo.
- Core exports in `src/index.ts`:
  - `elementToPngBlob(element, options)`
  - `elementToPngDataUrl(element, options)`
  - `copyPngToClipboard(blob, options)`
  - `copyElementAsPng(element, options)`
  - `copyMessageWithMcpApps(parts, options)`
  - `copyMessageElementWithInlineMcpApps(messageElement, appSelector, options)`
  - `buildMessageCopyPayload(parts, options)`
  - `downloadPng(blob, filename)`
  - `getClipboardSupport()`
  - `Mcp2PngError` typed errors
- React exports in `src/react.tsx`:
  - `useMcp2Png`
  - `Mcp2PngControls`
  - `Mcp2PngAppRenderer`
- MCP-aware export hook convention:
  - `window.__mcp2pngExport({ id, element, options })`
  - host association via `data-mcp2png-export="..."`
  - README documents future `x/mcp2png/export` convention.
- Full-message copy semantics added after Colt's note:
  - message copy preserves text/table/content order
  - MCP App regions are replaced inline with rendered PNG `<img>` nodes
  - app-only copy remains separate from message-level copy
- Demo:
  - `examples/basic/index.html`

## Verification commands run

From `/Users/gordieai/.openclaw/workspace/apps/mcp2png`:

```bash
npm install
npm run typecheck
npm test
npm run test:browser-smoke
npm run build
```

Final combined gate:

```bash
npm run typecheck && npm test && npm run test:browser-smoke && npm run build && npm pack --dry-run
```

Result:

```text
> mcp2png@0.1.0 typecheck
> tsc -p tsconfig.json --noEmit

> mcp2png@0.1.0 test
> vitest run

✓ tests/react.test.tsx (2 tests)
✓ tests/core.test.ts (11 tests)

Test Files  2 passed (2)
Tests       13 passed (13)

> mcp2png@0.1.0 test:browser-smoke
> vitest run -c vitest.browser.config.ts tests/browser-smoke.test.ts

✓ chromium tests/browser-smoke.test.ts (1 test)

Test Files  1 passed (1)
Tests       1 passed (1)

> mcp2png@0.1.0 build
> tsc -p tsconfig.build.json

npm notice package: mcp2png@0.1.0
npm notice filename: mcp2png-0.1.0.tgz
npm notice package size: 20.7 kB
npm notice unpacked size: 77.1 kB
npm notice total files: 43
```

## Notes

- The normal jsdom unit test suite intentionally excludes `tests/browser-smoke.test.ts`; jsdom lacks browser APIs used by `html-to-image` and fails on `SVGImageElement`. The browser smoke test runs separately in real Chromium through Vitest Browser + Playwright.
- `@mcp-ui/client` is not a runtime dependency. `Mcp2PngAppRenderer` accepts an AppRenderer-shaped component from the host.
- No npm publish and no remote push were performed.

## Recommended next step

Run a real host integration spike: wrap `@mcp-ui/client` AppRenderer inside an MCP Apps sandbox/iframe demo, validate clipboard permissions using `_meta.ui.permissions.clipboardWrite`, and decide whether `window.__mcp2pngExport` or an `x/mcp2png/export` resource/action shape should become the public convention.

## Correction: message-copy image must match visible app

Colt caught that the first Teams paste proof had a serious flaw: Teams rendered an inline image, but that image was not the visible MCP App card. The visible card was the blue Q2 revenue chart; the pasted image was a separate orange export-hook placeholder.

Root cause: the proof demo used `window.__mcp2pngExport`, and the message-copy path preferred that hook. That tested inline replacement, but not visual equivalence.

Fix:

- Added `forceDomCapture` capture option.
- Message-copy APIs now default to visible DOM capture so inline replacements match the card the user saw in the message.
- Callers can explicitly opt out with `forceDomCapture: false` when a visual-equivalent app export hook is trusted.
- Removed the placeholder export hook from the proof demo.
- Added browser proof artifacts for direct comparison:
  - `proof-chat-demo/artifacts/visible-mcp-app.png`
  - `proof-chat-demo/artifacts/clipboard-inline-image.png`
  - `proof-chat-demo/artifacts/clipboard-result.json`

Verification after fix:

- `npm run typecheck` passed.
- `npm test` passed, 14 tests.
- `npm run test:browser-smoke` passed, Chromium, 2 tests.
- `npm run build` passed.
- `npm pack --dry-run` passed, package size 21.1 kB, unpacked 78.6 kB, 43 files.
- `node apps/mcp2png/proof-chat-demo/verify-copy.mjs` passed all checks, including `didNotUsePlaceholderHook: true`.
- Vision comparison confirmed the visible app screenshot and extracted clipboard inline PNG match visually, aside from expected 2x scale/resolution.
