# Teams paste evidence

## 2026-05-28 initial user evidence

Colt pasted the copied chat message into Microsoft Teams and sent screenshot evidence from Teams.

Initial observation:

- Text above the app was present.
- An inline rendered image appeared where the MCP App region should be.
- The table below the app was present.
- No raw base64, HTML, or app data was visible.

Screenshot path:
`/Users/gordieai/.openclaw/media/inbound/3099c324-5754-43ba-b34a-44ccb13c2243.jpg`

## Correction after visual comparison

Colt correctly caught that the image content did not match the visible MCP App. The original visible app card was a blue Q2 revenue chart with Jan-Apr bars, but the Teams paste showed the separate orange export-hook placeholder: `This PNG came from the MCP export hook.`

Root cause: the proof demo registered `window.__mcp2pngExport`, and the message-copy path preferred that hook. That proved an inline image was inserted, but it did not prove visual equivalence with the rendered card.

Fix applied:

- Message-copy APIs now default to visible DOM capture by forcing `forceDomCapture: true` and `preferredExportHook: false` unless a caller explicitly opts out with `forceDomCapture: false`.
- The proof demo no longer registers the placeholder export hook.
- Browser proof now writes both the visible card screenshot and the extracted clipboard inline PNG for direct comparison.

New proof artifacts:

- Visible app screenshot: `apps/mcp2png/proof-chat-demo/artifacts/visible-mcp-app.png`
- Clipboard inline image extracted from rich HTML: `apps/mcp2png/proof-chat-demo/artifacts/clipboard-inline-image.png`
- Clipboard/result JSON: `apps/mcp2png/proof-chat-demo/artifacts/clipboard-result.json`

Verification:

- `node apps/mcp2png/proof-chat-demo/verify-copy.mjs` passed all checks, including `didNotUsePlaceholderHook: true`.
- Vision comparison confirmed `visible-mcp-app.png` and `clipboard-inline-image.png` visually match, with only expected scale/resolution difference.
