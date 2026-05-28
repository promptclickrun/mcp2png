import { Mcp2PngError } from './errors.js';
import { buildFileName } from './dom.js';
import { elementToPngBlob } from './capture.js';
import { normalizeClipboardOptions } from './options.js';
export function getClipboardSupport() {
    const hasClipboardItem = typeof globalThis.ClipboardItem !== 'undefined';
    const hasNavigatorClipboardWrite = typeof navigator !== 'undefined' && typeof navigator.clipboard?.write === 'function';
    return {
        hasClipboardItem,
        hasNavigatorClipboardWrite,
        canWritePng: hasClipboardItem && hasNavigatorClipboardWrite,
    };
}
function hasUserActivation() {
    if (typeof navigator === 'undefined')
        return false;
    const userActivation = navigator.userActivation;
    if (!userActivation)
        return true;
    return userActivation.isActive || userActivation.hasBeenActive;
}
export async function copyPngToClipboard(blob, options = {}) {
    const normalized = normalizeClipboardOptions(options);
    const support = getClipboardSupport();
    if (!support.canWritePng) {
        if (normalized.fallbackToDownload) {
            downloadPng(blob, normalized.fallbackFileName);
            return;
        }
        throw new Mcp2PngError('UNSUPPORTED_CLIPBOARD', 'This browser does not support writing PNG images with ClipboardItem.');
    }
    if (normalized.requireUserActivation && !hasUserActivation()) {
        if (normalized.fallbackToDownload) {
            downloadPng(blob, normalized.fallbackFileName);
            return;
        }
        throw new Mcp2PngError('MISSING_USER_ACTIVATION', 'Clipboard image writes must be triggered by a trusted user gesture such as a click.');
    }
    try {
        const png = blob.type === 'image/png' ? blob : blob.slice(0, blob.size, 'image/png');
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
    }
    catch (error) {
        if (normalized.fallbackToDownload) {
            downloadPng(blob, normalized.fallbackFileName);
            return;
        }
        throw new Mcp2PngError('CLIPBOARD_WRITE_FAILED', 'Browser rejected the PNG clipboard write.', { cause: error });
    }
}
export async function copyElementAsPng(target, options = {}) {
    const fileName = buildFileName(options.fileName ?? options.fallbackFileName, 'mcp-app.png');
    const blob = await elementToPngBlob(target, options);
    try {
        await copyPngToClipboard(blob, {
            ...(options.requireUserActivation === undefined ? {} : { requireUserActivation: options.requireUserActivation }),
            fallbackToDownload: false,
            fallbackFileName: fileName,
        });
        return { ok: true, method: 'clipboard', blob };
    }
    catch (error) {
        if (options.fallbackToDownload) {
            downloadPng(blob, fileName);
            return { ok: true, method: 'download', blob };
        }
        throw error;
    }
}
export function downloadPng(blob, filename = 'mcp-app.png') {
    if (typeof document === 'undefined') {
        throw new Mcp2PngError('DOWNLOAD_FAILED', 'downloadPng requires a browser document.');
    }
    const safeName = buildFileName(filename, 'mcp-app.png');
    const url = URL.createObjectURL(blob.type === 'image/png' ? blob : blob.slice(0, blob.size, 'image/png'));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = safeName;
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    try {
        document.body.append(anchor);
        anchor.click();
        return url;
    }
    finally {
        anchor.remove();
        URL.revokeObjectURL(url);
    }
}
//# sourceMappingURL=clipboard.js.map