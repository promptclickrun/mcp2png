import { elementToPngBlob } from './capture.js';
import { copyPngToClipboard } from './clipboard.js';
import { blobToDataUrl, resolveElement } from './dom.js';
import { Mcp2PngError } from './errors.js';
function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
}
function htmlToText(html) {
    if (typeof document === 'undefined') {
        return html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
    }
    const container = document.createElement('div');
    container.innerHTML = html;
    return container.textContent ?? '';
}
function plainTextToHtml(text) {
    return escapeHtml(text).replace(/\n/g, '<br>');
}
function messageCaptureOptions(options) {
    if (options.forceDomCapture === false) {
        return { ...options, forceDomCapture: false };
    }
    return { ...options, forceDomCapture: true, preferredExportHook: false };
}
async function normalizePart(part, captureOptions) {
    switch (part.type) {
        case 'html': {
            const text = part.text ?? htmlToText(part.html);
            return { html: part.html, text };
        }
        case 'text':
            return { html: plainTextToHtml(part.text), text: part.text };
        case 'mcp-app': {
            const blob = await elementToPngBlob(part.element, messageCaptureOptions(part.captureOptions ?? captureOptions));
            const src = await blobToDataUrl(blob);
            const alt = part.alt ?? 'MCP App screenshot';
            const className = part.className ? ` class="${escapeAttribute(part.className)}"` : '';
            const id = part.id ? ` data-mcp2png-export="${escapeAttribute(part.id)}"` : '';
            const html = `<img${id}${className} src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}">`;
            return { html, text: `[${alt}]` };
        }
        default:
            throw new Mcp2PngError('INVALID_OPTIONS', 'Unsupported message copy part.');
    }
}
async function writeHtmlClipboard(html, text, options) {
    const support = typeof globalThis.ClipboardItem !== 'undefined'
        && typeof navigator !== 'undefined'
        && typeof navigator.clipboard?.write === 'function';
    if (!support) {
        throw new Mcp2PngError('UNSUPPORTED_CLIPBOARD', 'This browser does not support writing rich HTML clipboard payloads.');
    }
    const pngBlob = new Blob([html], { type: 'text/html' });
    const textBlob = new Blob([text], { type: 'text/plain' });
    try {
        await navigator.clipboard.write([new ClipboardItem({
                'text/html': pngBlob,
                'text/plain': textBlob,
            })]);
    }
    catch (error) {
        throw new Mcp2PngError('CLIPBOARD_WRITE_FAILED', 'Browser rejected the rich message clipboard write.', { cause: error });
    }
}
export async function buildMessageCopyPayload(parts, options = {}) {
    if (!Array.isArray(parts) || parts.length === 0) {
        throw new Mcp2PngError('INVALID_OPTIONS', 'buildMessageCopyPayload requires at least one message part.');
    }
    const normalized = await Promise.all(parts.map((part) => normalizePart(part, options)));
    return {
        ok: true,
        method: 'html',
        html: normalized.map((part) => part.html).join(''),
        text: normalized.map((part) => part.text).join(''),
    };
}
export async function copyMessageWithMcpApps(parts, options = {}) {
    const { clipboard, ...captureOptions } = options;
    const payload = await buildMessageCopyPayload(parts, captureOptions);
    await writeHtmlClipboard(payload.html, payload.text, clipboard ?? {});
    return payload;
}
export async function copyMessageElementWithInlineMcpApps(message, appSelector = '[data-mcp2png-export]', options = {}) {
    const element = resolveElement(message);
    const clone = element.cloneNode(true);
    const originalApps = Array.from(element.querySelectorAll(appSelector));
    const clonedApps = Array.from(clone.querySelectorAll(appSelector));
    if (originalApps.length === 0) {
        throw new Mcp2PngError('NULL_ELEMENT', `No MCP App elements matched selector ${appSelector}.`);
    }
    await Promise.all(originalApps.map(async (app, index) => {
        const replacementTarget = clonedApps[index];
        if (!replacementTarget)
            return;
        const blob = await elementToPngBlob(app, messageCaptureOptions(options));
        const src = await blobToDataUrl(blob);
        const image = document.createElement('img');
        const exportId = app.getAttribute('data-mcp2png-export');
        if (exportId)
            image.setAttribute('data-mcp2png-export', exportId);
        image.src = src;
        image.alt = app.getAttribute('aria-label') ?? app.getAttribute('title') ?? 'MCP App screenshot';
        image.className = 'mcp2png-inline-replacement';
        replacementTarget.replaceWith(image);
    }));
    const payload = {
        ok: true,
        method: 'html',
        html: clone.innerHTML,
        text: clone.textContent ?? '',
    };
    await writeHtmlClipboard(payload.html, payload.text, options.clipboard ?? {});
    return payload;
}
export async function copyAppOnlyOrDownload(element, options = {}) {
    const blob = await elementToPngBlob(element, options);
    await copyPngToClipboard(blob, options);
    return { ok: true, method: 'clipboard', blob };
}
//# sourceMappingURL=message-copy.js.map