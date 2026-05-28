import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const url = process.argv[2] ?? 'http://127.0.0.1:4178/docs/index.html';
const outDir = path.resolve('docs/artifacts');
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(msg.text());
});
const response = await page.goto(url, { waitUntil: 'networkidle' });
if (!response?.ok()) errors.push(`HTTP ${response?.status()} for ${url}`);
const title = await page.title();
const h1 = await page.locator('h1').innerText();
const ctaVisible = await page.getByRole('link', { name: /View on GitHub/i }).first().isVisible();
await page.screenshot({ path: path.join(outDir, 'site-home.png'), fullPage: true });
await browser.close();

const result = { url, title, h1, ctaVisible, errors, screenshot: path.join(outDir, 'site-home.png') };
console.log(JSON.stringify(result, null, 2));
if (errors.length || !title.includes('mcp2png') || !h1.includes('Copy rendered MCP Apps') || !ctaVisible) process.exit(1);
