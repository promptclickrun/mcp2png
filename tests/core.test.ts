import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Mpc2PngError,
  buildFileName,
  buildMessageCopyPayload,
  copyPngToClipboard,
  downloadPng,
  elementToPngDataUrl,
  getClipboardSupport,
  normalizeCaptureOptions,
  normalizeClipboardOptions,
  resolveElement,
} from '../src/index.js';

describe('option normalization', () => {
  it('normalizes capture defaults for deterministic PNG export', () => {
    expect(normalizeCaptureOptions()).toEqual({
      backgroundColor: '#ffffff',
      cacheBust: true,
      filter: undefined,
      pixelRatio: 2,
      preferredExportHook: true,
      forceDomCapture: false,
      quality: 1,
      skipFonts: false,
      style: undefined,
      timeoutMs: 10_000,
      width: undefined,
      height: undefined,
    });
  });

  it('preserves caller supplied capture options', () => {
    const filter = (node: Element) => node.tagName !== 'SCRIPT';
    const style = { borderRadius: '12px' };

    expect(normalizeCaptureOptions({
      backgroundColor: 'transparent',
      cacheBust: false,
      filter,
      height: 200,
      pixelRatio: 1,
      preferredExportHook: false,
      forceDomCapture: true,
      quality: 0.7,
      skipFonts: true,
      style,
      timeoutMs: 250,
      width: 300,
    })).toEqual({
      backgroundColor: 'transparent',
      cacheBust: false,
      filter,
      height: 200,
      pixelRatio: 1,
      preferredExportHook: false,
      forceDomCapture: true,
      quality: 0.7,
      skipFonts: true,
      style,
      timeoutMs: 250,
      width: 300,
    });
  });

  it('rejects invalid capture dimensions with a typed error', () => {
    expect(() => normalizeCaptureOptions({ pixelRatio: 0 })).toThrowError(Mpc2PngError);
    expect(() => normalizeCaptureOptions({ width: -10 })).toThrowError(/width/);
  });

  it('normalizes clipboard defaults', () => {
    expect(normalizeClipboardOptions()).toEqual({
      requireUserActivation: true,
      fallbackToDownload: false,
      fallbackFileName: 'mcp-app.png',
    });
  });
});

describe('typed errors and support checks', () => {
  it('throws a null element error when no element is provided', () => {
    expect(() => resolveElement(null)).toThrowError(Mpc2PngError);

    try {
      resolveElement(null);
    } catch (error) {
      expect(error).toBeInstanceOf(Mpc2PngError);
      expect((error as Mpc2PngError).code).toBe('NULL_ELEMENT');
    }
  });

  it('detects ClipboardItem and navigator clipboard support', () => {
    const originalClipboardItem = globalThis.ClipboardItem;
    const originalNavigator = globalThis.navigator;

    Object.defineProperty(globalThis, 'ClipboardItem', {
      configurable: true,
      value: function ClipboardItem() {},
    });
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { clipboard: { write: vi.fn() } },
    });

    expect(getClipboardSupport()).toEqual({
      hasClipboardItem: true,
      hasNavigatorClipboardWrite: true,
      canWritePng: true,
    });

    Object.defineProperty(globalThis, 'ClipboardItem', { configurable: true, value: originalClipboardItem });
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: originalNavigator });
  });

  it('throws UNSUPPORTED_CLIPBOARD when ClipboardItem is unavailable', async () => {
    const originalClipboardItem = globalThis.ClipboardItem;
    Object.defineProperty(globalThis, 'ClipboardItem', { configurable: true, value: undefined });

    await expect(copyPngToClipboard(new Blob(['png'], { type: 'image/png' }))).rejects.toMatchObject({
      code: 'UNSUPPORTED_CLIPBOARD',
    });

    Object.defineProperty(globalThis, 'ClipboardItem', { configurable: true, value: originalClipboardItem });
  });
});

describe('downloadPng', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('creates an object URL, clicks a temporary link, and revokes the URL', () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    const url = downloadPng(new Blob(['png'], { type: 'image/png' }), 'Card Title: v1.png');

    expect(url).toBe('blob:test-url');
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
    expect(document.querySelector('a')).toBeNull();
  });

  it('sanitizes unsafe filenames but keeps png extension', () => {
    expect(buildFileName('../foo/bar?:name', 'fallback.png')).toBe('foo-bar-name.png');
    expect(buildFileName('', 'fallback.png')).toBe('fallback.png');
    expect(buildFileName('already.png', 'fallback.png')).toBe('already.png');
  });
});

describe('elementToPngDataUrl', () => {
  it('prefers an app-provided export hook when available', async () => {
    const element = document.createElement('div');
    element.dataset.mcp2pngExport = 'card-1';
    document.body.append(element);

    (window as any).__mcp2pngExport = vi.fn(async (request: any) => {
      expect(request.id).toBe('card-1');
      expect(request.element).toBe(element);
      return 'data:image/png;base64,aG9vaw==';
    });

    await expect(elementToPngDataUrl(element)).resolves.toBe('data:image/png;base64,aG9vaw==');
  });
});

describe('message copy replacement', () => {
  it('defaults message-copy captures to visible DOM instead of an app-provided export hook', async () => {
    const normalized = normalizeCaptureOptions({ preferredExportHook: true, forceDomCapture: true });

    expect(normalized.forceDomCapture).toBe(true);
    expect(normalized.preferredExportHook).toBe(false);
  });

  it('preserves message order and replaces the MCP App part with an inline PNG image', async () => {
    const app = document.createElement('section');
    app.dataset.mcp2pngExport = 'chart-1';
    document.body.append(app);

    (window as any).__mcp2pngExport = vi.fn(async () => 'data:image/png;base64,aW5saW5l');

    const payload = await buildMessageCopyPayload([
      { type: 'html', html: '<p>Summary above</p>', text: 'Summary above\n' },
      { type: 'mcp-app', element: app, id: 'chart-1', alt: 'Revenue chart' },
      { type: 'html', html: '<table><tr><td>Total</td><td>$42</td></tr></table>', text: '\nTotal $42' },
    ], { forceDomCapture: false });

    expect(payload.html).toContain('<p>Summary above</p><img');
    expect(payload.html).toContain('data-mcp2png-export="chart-1"');
    expect(payload.html).toContain('src="data:image/png;base64,aW5saW5l"');
    expect(payload.html).toContain('alt="Revenue chart"');
    expect(payload.html.indexOf('<p>Summary above</p>')).toBeLessThan(payload.html.indexOf('<img'));
    expect(payload.html.indexOf('<img')).toBeLessThan(payload.html.indexOf('<table>'));
    expect(payload.text).toBe('Summary above\n[Revenue chart]\nTotal $42');
  });
});
