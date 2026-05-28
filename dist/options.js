import { Mcp2PngError } from './errors.js';
function assertPositiveFinite(value, field) {
    if (value === undefined)
        return;
    if (!Number.isFinite(value) || value <= 0) {
        throw new Mcp2PngError('INVALID_OPTIONS', `${field} must be a positive finite number.`);
    }
}
function assertRange(value, field, min, max) {
    if (value === undefined)
        return;
    if (!Number.isFinite(value) || value < min || value > max) {
        throw new Mcp2PngError('INVALID_OPTIONS', `${field} must be between ${min} and ${max}.`);
    }
}
export function normalizeCaptureOptions(options = {}) {
    assertPositiveFinite(options.width, 'width');
    assertPositiveFinite(options.height, 'height');
    assertPositiveFinite(options.pixelRatio, 'pixelRatio');
    assertPositiveFinite(options.timeoutMs, 'timeoutMs');
    assertRange(options.quality, 'quality', 0, 1);
    return {
        backgroundColor: options.backgroundColor ?? '#ffffff',
        cacheBust: options.cacheBust ?? true,
        filter: options.filter,
        height: options.height,
        pixelRatio: options.pixelRatio ?? 2,
        preferredExportHook: options.forceDomCapture ? false : (options.preferredExportHook ?? true),
        forceDomCapture: options.forceDomCapture ?? false,
        quality: options.quality ?? 1,
        skipFonts: options.skipFonts ?? false,
        style: options.style,
        timeoutMs: options.timeoutMs ?? 10_000,
        width: options.width,
    };
}
export function normalizeClipboardOptions(options = {}) {
    return {
        requireUserActivation: options.requireUserActivation ?? true,
        fallbackToDownload: options.fallbackToDownload ?? false,
        fallbackFileName: options.fallbackFileName ?? 'mcp-app.png',
    };
}
//# sourceMappingURL=options.js.map