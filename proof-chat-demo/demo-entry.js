import { copyMessageElementWithInlineMcpApps } from '../dist/index.js';

const message = document.getElementById('message');
const status = document.getElementById('status');
const preview = document.getElementById('preview');
const button = document.getElementById('copy-message');

// Deliberately no app-provided export hook in this proof. The chat-message copy
// path must capture the visible rendered card, not a separate app-produced image.

async function readClipboardHtml() {
  if (!navigator.clipboard?.read) return 'navigator.clipboard.read unavailable in this browser';
  const items = await navigator.clipboard.read();
  for (const item of items) {
    if (item.types.includes('text/html')) {
      return await (await item.getType('text/html')).text();
    }
  }
  return 'No text/html clipboard item found';
}

button.addEventListener('click', async () => {
  status.textContent = 'Copying...';
  try {
    const result = await copyMessageElementWithInlineMcpApps(message, '[data-mcp2png-export]', {
      backgroundColor: '#ffffff',
      pixelRatio: 2,
      clipboard: { requireUserActivation: false },
    });
    window.__lastCopyResult = result;
    status.textContent = 'Copied full message with inline PNG replacement.';
    const clipboardHtml = await readClipboardHtml().catch(error => `Could not read clipboard: ${error.message}`);
    preview.textContent = clipboardHtml;
  } catch (error) {
    console.error(error);
    status.textContent = `Failed: ${error.message}`;
    preview.textContent = error.stack || String(error);
  }
});
