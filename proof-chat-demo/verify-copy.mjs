import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const demoDir = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(demoDir, 'artifacts');
await fs.mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 1000 },
  permissions: ['clipboard-read', 'clipboard-write'],
});
const page = await context.newPage();
page.on('console', msg => console.log('browser console:', msg.type(), msg.text()));
page.on('pageerror', err => console.log('browser pageerror:', err.message));
await page.goto('http://127.0.0.1:4178/proof-chat-demo/index.html', { waitUntil: 'networkidle' });
await page.screenshot({ path: path.join(outDir, '01-before-copy.png') });
await page.locator('#sales-card').screenshot({ path: path.join(outDir, 'visible-mcp-app.png') });
await page.getByRole('button', { name: 'Copy chat message' }).click();
await page.waitForFunction(() => window.__lastCopyResult?.html?.includes('data:image'), undefined, { timeout: 30000 });
await page.screenshot({ path: path.join(outDir, '02-after-copy.png') });
const result = await page.evaluate(async () => {
  const app = document.querySelector('[data-mcp2png-export="sales-card-q2"]');
  const copy = window.__lastCopyResult;
  const clipboardItems = await navigator.clipboard.read();
  const htmlBlob = await clipboardItems[0].getType('text/html');
  const textBlob = await clipboardItems[0].getType('text/plain');
  const html = await htmlBlob.text();
  const text = await textBlob.text();
  const preview = document.querySelector('#preview')?.textContent ?? '';
  const dataUrlMatch = html.match(/<img[^>]+src="(data:image\/png;base64,[^"]+)"/);
  return {
    status: document.querySelector('#status')?.textContent,
    originalAppTag: app?.tagName,
    copyHtml: copy.html,
    copyText: copy.text,
    clipboardHtml: html,
    clipboardText: text,
    preview,
    inlineImageDataUrl: dataUrlMatch?.[1] ?? null,
    checks: {
      hasTextAbove: html.includes('Quarterly readout'),
      hasInlineImage: /<img[^>]+src="data:image\//.test(html),
      hasExportId: html.includes('data-mcp2png-export="sales-card-q2"'),
      hasTableBelow: html.includes('Total pipeline') && html.includes('$42,000'),
      orderPreserved: html.indexOf('Quarterly readout') < html.indexOf('<img') && html.indexOf('<img') < html.indexOf('Total pipeline'),
      originalDomStillApp: app?.tagName === 'SECTION',
      didNotUsePlaceholderHook: !html.includes('This PNG came from the MCP export hook'),
    },
  };
});

if (result.inlineImageDataUrl) {
  const base64 = result.inlineImageDataUrl.replace(/^data:image\/png;base64,/, '');
  await fs.writeFile(path.join(outDir, 'clipboard-inline-image.png'), Buffer.from(base64, 'base64'));
}

await fs.writeFile(path.join(outDir, 'clipboard-result.json'), JSON.stringify({ ...result, inlineImageDataUrl: result.inlineImageDataUrl ? '[written to clipboard-inline-image.png]' : null }, null, 2));
await browser.close();

const failed = Object.entries(result.checks).filter(([, ok]) => !ok);
console.log(JSON.stringify({
  status: result.status,
  checks: result.checks,
  failed,
  artifacts: {
    before: path.join(outDir, '01-before-copy.png'),
    visibleApp: path.join(outDir, 'visible-mcp-app.png'),
    after: path.join(outDir, '02-after-copy.png'),
    inlineImage: path.join(outDir, 'clipboard-inline-image.png'),
    result: path.join(outDir, 'clipboard-result.json'),
  },
}, null, 2));
if (failed.length) process.exit(1);
