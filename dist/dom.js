import { Mcp2PngError } from './errors.js';
export function resolveElement(target) {
    const element = target && 'current' in target ? target.current : target;
    if (!element) {
        throw new Mcp2PngError('NULL_ELEMENT', 'mcp2png needs a non-null Element or React ref.');
    }
    return element;
}
export function dataUrlToBlob(dataUrl) {
    const [header, encoded] = dataUrl.split(',');
    if (!header || encoded === undefined || !header.startsWith('data:')) {
        throw new Mcp2PngError('CAPTURE_FAILED', 'Export hook returned an invalid data URL.');
    }
    const mimeMatch = /data:([^;]+)/.exec(header);
    const mimeType = mimeMatch?.[1] ?? 'application/octet-stream';
    const binary = header.includes(';base64') ? atob(encoded) : decodeURIComponent(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    return new Blob([bytes], { type: mimeType });
}
export function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error ?? new Error('Failed to read blob as data URL.'));
        reader.readAsDataURL(blob);
    });
}
export function buildFileName(input, fallback = 'mcp-app.png') {
    const candidate = (input ?? '').trim() || fallback;
    const fileName = candidate
        .replace(/\\/g, '/')
        .split('/')
        .filter((part) => part && part !== '.' && part !== '..')
        .join('-')
        .replace(/[<>:"|?*\u0000-\u001f]/g, '-')
        .replace(/\s+/g, ' ')
        .replace(/-+/g, '-')
        .replace(/^\.+/, '')
        .trim();
    const safe = fileName || fallback;
    return safe.toLowerCase().endsWith('.png') ? safe : `${safe}.png`;
}
//# sourceMappingURL=dom.js.map