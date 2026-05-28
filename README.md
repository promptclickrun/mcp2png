# mcp2png

Copy rendered MCP Apps as PNGs, without leaking raw app payloads into chat, email, docs, or Teams.

`mcp2png` is a small TypeScript library for chat app builders. It captures the visible output of an MCP App or host-rendered card, writes it to the clipboard as `image/png`, and can also build a rich `text/html` clipboard payload for an entire chat message where the MCP App is replaced inline by a PNG.

That last part is the whole point: when a message has text above an MCP App, the app in the middle, and a table or explanation below it, a normal “copy message” action should preserve the message structure and replace only the app region with the image the user actually saw.

## What it solves

MCP Apps are great inside a chat host. Copy and paste is where things can get ugly.

A rendered app card can become:

- raw HTML
- base64 noise
- inaccessible sandbox data
- a missing iframe
- a different export than the visible card
- plain text that drops the visual result entirely

`mcp2png` gives hosts a predictable capture and clipboard pipeline:

1. Capture the visible rendered card as a PNG.
2. Copy that PNG directly for card-level copy actions.
3. For full-message copy, clone the message HTML and replace MCP App nodes with inline PNG images in place.
4. Preserve surrounding prose, tables, code blocks, and order.
5. Fall back to download when clipboard APIs are unavailable.

## Features

- Element to PNG `Blob` or data URL
- Direct PNG clipboard writes with `ClipboardItem`
- Download fallback for unsupported clipboard environments
- Full-message rich clipboard payloads with inline MCP App PNG replacement
- Defaults to visible DOM capture for message copy, so the pasted image matches what the user saw
- Optional app-provided export hook for trusted visual-equivalent exports
- React hooks and components
- Typed errors with stable error codes
- Browser smoke tests and a proof demo verified against Microsoft Teams paste behavior

## Install

```bash
npm install mcp2png
```

Peer packages are optional and depend on your integration:

```bash
npm install react @mcp-ui/client
```

`react` is only needed for `mcp2png/react`. `@mcp-ui/client` is only needed if your app already uses it. The core package does not import it at runtime.

## Quickstart: copy one rendered card as PNG

```ts
import { copyElementAsPng } from 'mcp2png';

const card = document.querySelector('[data-mcp-card]');
const button = document.querySelector('#copy-card');

button?.addEventListener('click', async () => {
  await copyElementAsPng(card, {
    fileName: 'mcp-card.png',
    pixelRatio: 2,
    fallbackToDownload: true,
  });
});
```

Clipboard image writes usually require a user gesture. Call copy functions from a click or keyboard handler.

## Quickstart: copy a full chat message with inline app replacement

Use this for a chat message copy button.

```ts
import { copyMessageElementWithInlineMcpApps } from 'mcp2png';

const message = document.querySelector('[data-chat-message-id="42"]');

copyButton.addEventListener('click', async () => {
  await copyMessageElementWithInlineMcpApps(
    message,
    '[data-mcp2png-export]',
    {
      backgroundColor: '#ffffff',
      pixelRatio: 2,
    },
  );
});
```

Input DOM:

```html
<article data-chat-message-id="42">
  <p>Quarterly readout: revenue is pacing ahead of target.</p>

  <section data-mcp2png-export="sales-card-q2">
    <!-- rendered MCP App -->
  </section>

  <table>
    <tr><td>Total pipeline</td><td>$42,000</td></tr>
  </table>
</article>
```

Clipboard HTML:

```html
<p>Quarterly readout: revenue is pacing ahead of target.</p>

<img
  data-mcp2png-export="sales-card-q2"
  class="mcp2png-inline-replacement"
  src="data:image/png;base64,..."
  alt="MCP App screenshot"
>

<table>
  <tr><td>Total pipeline</td><td>$42,000</td></tr>
</table>
```

Paste target result:

- the paragraph remains above the app
- the MCP App becomes an inline PNG at the same position
- the table remains below it
- raw app payloads never reach the paste target

## Visual equivalence matters

The message-copy path defaults to visible DOM capture.

That is intentional. If an app-provided export hook returns a different graphic than the card on screen, the paste is wrong even though an image exists. `mcp2png` treats full-message copy as a user-visible fidelity problem: the PNG should match the rendered app the user saw in the chat message.

For app-level copy actions, export hooks are still useful. For full-message copy, prefer host DOM capture unless the export hook has a hard visual-equivalence contract.

## API reference

### `elementToPngBlob(element, options?)`

Captures an element to an `image/png` `Blob`.

```ts
const blob = await elementToPngBlob(card, {
  backgroundColor: '#ffffff',
  pixelRatio: 2,
});
```

### `elementToPngDataUrl(element, options?)`

Captures an element to a PNG data URL.

```ts
const dataUrl = await elementToPngDataUrl(card);
```

### `copyPngToClipboard(blob, options?)`

Writes a PNG blob to the system clipboard.

```ts
await copyPngToClipboard(blob, {
  requireUserActivation: true,
});
```

### `copyElementAsPng(element, options?)`

Captures an element and copies the PNG in one call.

```ts
const result = await copyElementAsPng(card, {
  fileName: 'answer-card.png',
  fallbackToDownload: true,
});

console.log(result.method); // "clipboard" or "download"
```

### `buildMessageCopyPayload(parts, options?)`

Builds a rich message payload without writing to the clipboard. Use it when your app already has its own clipboard writer.

```ts
const payload = await buildMessageCopyPayload([
  { type: 'html', html: '<p>Summary above</p>' },
  { type: 'mcp-app', element: chart, id: 'chart-1', alt: 'Revenue chart' },
  { type: 'html', html: '<table><tr><td>Total</td><td>$42</td></tr></table>' },
]);

await navigator.clipboard.write([
  new ClipboardItem({
    'text/html': new Blob([payload.html], { type: 'text/html' }),
    'text/plain': new Blob([payload.text], { type: 'text/plain' }),
  }),
]);
```

### `copyMessageWithMcpApps(parts, options?)`

Builds and writes a rich `text/html` clipboard payload from explicit message parts.

```ts
await copyMessageWithMcpApps([
  { type: 'text', text: 'Summary above\n' },
  { type: 'mcp-app', element: chart, id: 'chart-1', alt: 'Revenue chart' },
  { type: 'html', html: '<p>Summary below</p>' },
]);
```

### `copyMessageElementWithInlineMcpApps(messageElement, appSelector?, options?)`

Clones a message DOM node, captures each matching app node, replaces those cloned nodes with inline PNG `<img>` tags, then writes the resulting message HTML to the clipboard.

```ts
await copyMessageElementWithInlineMcpApps(
  messageElement,
  '[data-mcp2png-export]',
  { pixelRatio: 2 },
);
```

### `downloadPng(blob, filename?)`

Downloads a PNG blob and returns the temporary object URL.

```ts
downloadPng(blob, 'mcp-card.png');
```

### Support helpers

```ts
import { getClipboardSupport, isMcp2PngError } from 'mcp2png';

const support = getClipboardSupport();
// { hasClipboardItem, hasNavigatorClipboardWrite, canWritePng }
```

## Options

### Capture options

| Option | Default | Notes |
|---|---:|---|
| `backgroundColor` | `#ffffff` | Use `transparent` to preserve alpha when supported. |
| `cacheBust` | `true` | Helps refresh external assets before capture. |
| `filter` | `undefined` | Passed to `html-to-image` to skip nodes. |
| `height` / `width` | `undefined` | Override output dimensions in CSS pixels. |
| `pixelRatio` | `2` | Crisp default for chat cards. |
| `preferredExportHook` | `true` | For app-level capture, try `window.__mcp2pngExport` before DOM capture. |
| `forceDomCapture` | `false` | Ignore export hooks and capture visible DOM. Message-copy APIs default this to `true`. |
| `quality` | `1` | Dependency option. PNG remains lossless. |
| `skipFonts` | `false` | Set true if webfont embedding causes CORS issues. |
| `style` | `undefined` | Temporary style overrides during capture. |
| `timeoutMs` | `10000` | Export hook timeout. |

### Clipboard options

| Option | Default | Notes |
|---|---:|---|
| `requireUserActivation` | `true` | Checks `navigator.userActivation` when available. |
| `fallbackToDownload` | `false` | Download instead of throwing on clipboard failure. |
| `fallbackFileName` | `mcp-app.png` | Used by fallback download. |

`copyElementAsPng` also accepts `fileName`.

## Export hook convention

A host or app can provide a global export hook:

```ts
window.__mcp2pngExport = async ({ id, element, options }) => {
  // Return a PNG data URL or image/png Blob.
  return canvas.toDataURL('image/png');
};
```

Associate a rendered app with an export id:

```html
<div data-mcp2png-export="map-result-123"></div>
```

The hook receives:

```ts
{
  id?: string;
  element: Element;
  options: NormalizedCaptureOptions;
}
```

Recommended use:

- Use export hooks for app-level “copy image” actions when the app can render an exact PNG.
- Avoid export hooks for full-message copy unless the hook is guaranteed to match the visible card.
- Use `forceDomCapture: true` whenever visual equivalence matters more than app-controlled export.

## React integration

Import from `mcp2png/react`.

### `useMcp2Png`

```tsx
import { useMcp2Png } from 'mcp2png/react';

export function Card() {
  const png = useMcp2Png({ fileName: 'card.png', fallbackToDownload: true });

  return (
    <>
      <article ref={png.ref}>Rendered MCP card</article>
      <button disabled={png.busy} onClick={() => png.copy()}>
        Copy PNG
      </button>
    </>
  );
}
```

### `Mcp2PngControls`

```tsx
<Mcp2PngControls
  target={cardRef}
  fileName="mcp-card.png"
  fallbackToDownload
  labels={{ copy: 'Copy image', download: 'Download image' }}
/>
```

### `Mcp2PngAppRenderer`

Wrap any AppRenderer-shaped component without making `@mcp-ui/client` a hard dependency.

```tsx
import { AppRenderer } from '@mcp-ui/client';
import { Mcp2PngAppRenderer } from 'mcp2png/react';

<Mcp2PngAppRenderer
  AppRenderer={AppRenderer}
  resource={resource}
  exportId={resource.id}
  controls={{ fileName: 'mcp-output.png', fallbackToDownload: true }}
/>;
```

## MCP Apps host integration guide

Recommended fallback tiers for chat app builders:

1. **Full-message copy with inline replacement.** For a chat message copy button, preserve message structure and replace each MCP App region with its rendered PNG in place.
2. **Visible DOM capture.** Default for message copy. It protects against export hooks that return a different image than the visible card.
3. **App-provided export hook.** Good for trusted card-level image export. Use for message copy only with a visual-equivalence contract.
4. **Host capture of a safe wrapper.** Wrap the `AppRenderer` output in a host-owned element and capture that element.
5. **Download fallback.** If `ClipboardItem` or user activation is unavailable, offer a PNG download.
6. **Text fallback.** Use only when the user explicitly asks for raw data or when visual capture cannot succeed.

## Browser support

`mcp2png` depends on modern browser APIs:

- `Blob`
- `HTMLCanvasElement`
- `navigator.clipboard.write`
- `ClipboardItem`
- `navigator.userActivation` when available

Direct PNG clipboard writes are strongest in Chromium-family browsers. Rich `text/html` clipboard writes are also broadly useful for paste targets such as Microsoft Teams, email, and docs. Clipboard support varies by browser, security context, user activation, and paste target.

Use `getClipboardSupport()` and `fallbackToDownload` for resilient UI.

## Security and privacy

`mcp2png` is designed for host-controlled capture. Treat the captured element as sensitive:

- Do not capture hidden secrets or offscreen private data.
- Avoid leaking raw MCP payloads into `text/plain` fallbacks.
- Prefer explicit selectors for app regions, such as `[data-mcp2png-export]`.
- Sanitize or omit surrounding message HTML if your host allows untrusted user content.
- Keep clipboard writes inside user gestures.

## Testing and verification

Local gates:

```bash
npm run typecheck
npm test
npm run test:browser-smoke
npm run build
npm pack --dry-run
```

Proof demo:

```bash
npm run build
npx vite --host 127.0.0.1 --port 4178
node proof-chat-demo/verify-copy.mjs
```

The proof script writes artifacts to:

```text
proof-chat-demo/artifacts/visible-mcp-app.png
proof-chat-demo/artifacts/clipboard-inline-image.png
proof-chat-demo/artifacts/clipboard-result.json
```

Those artifacts verify that the visible MCP App and the clipboard inline PNG visually match, while message order is preserved.

## Project structure

```text
src/
  capture.ts        DOM and export-hook capture
  clipboard.ts      Clipboard and download helpers
  message-copy.ts   Full-message inline replacement
  react.tsx         React hook and components
  types.ts          Public types
examples/basic/     Minimal browser demo
proof-chat-demo/    Full-message copy proof and artifacts
tests/              Unit and browser smoke tests
docs/               GitHub Pages site
```

## Status

`mcp2png` is a working OSS prototype. It is ready for repo-level review, integration experiments, and feedback from MCP host builders. It is not published to npm yet.

## License

MIT
