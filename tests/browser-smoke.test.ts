import { describe, expect, it } from 'vitest';
import { buildMessageCopyPayload, elementToPngDataUrl } from '../src/index.js';

describe('browser smoke', () => {
  it('captures a simple DOM card to a PNG data URL in a real browser', async () => {
    const card = document.createElement('div');
    card.style.width = '160px';
    card.style.height = '80px';
    card.style.padding = '12px';
    card.style.background = '#114488';
    card.style.color = '#ffffff';
    card.textContent = 'mcp2png smoke';
    document.body.append(card);

    const dataUrl = await elementToPngDataUrl(card, { pixelRatio: 1, preferredExportHook: false });

    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);
    expect(dataUrl.length).toBeGreaterThan(100);
  });

  it('message copy captures the visible rendered app when an export hook would differ', async () => {
    const card = document.createElement('section');
    card.dataset.mcp2pngExport = 'visible-card';
    card.style.width = '240px';
    card.style.height = '120px';
    card.style.background = '#1d4ed8';
    card.style.color = '#ffffff';
    card.style.display = 'grid';
    card.style.placeItems = 'center';
    card.style.font = '700 20px Arial, sans-serif';
    card.textContent = 'VISIBLE DOM CARD';
    document.body.append(card);

    (window as any).__mcp2pngExport = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 240;
      canvas.height = 120;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#f97316';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#111827';
      ctx.font = '700 20px Arial, sans-serif';
      ctx.fillText('WRONG HOOK IMAGE', 20, 64);
      return canvas.toDataURL('image/png');
    };

    const payload = await buildMessageCopyPayload([
      { type: 'html', html: '<p>before</p>' },
      { type: 'mcp-app', element: card, id: 'visible-card', alt: 'Visible card' },
      { type: 'html', html: '<p>after</p>' },
    ]);

    expect(payload.html).toContain('<p>before</p><img');
    expect(payload.html).toContain('<p>after</p>');
    expect(payload.html).not.toContain('WRONG HOOK IMAGE');
    expect(payload.html).toContain('data:image/png;base64,');
  });
});
