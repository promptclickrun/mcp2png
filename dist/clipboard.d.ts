import type { ClipboardOptions, ClipboardSupport, CopyElementOptions, CopyResult, ElementLike } from './types.js';
export declare function getClipboardSupport(): ClipboardSupport;
export declare function copyPngToClipboard(blob: Blob, options?: ClipboardOptions): Promise<void>;
export declare function copyElementAsPng(target: ElementLike, options?: CopyElementOptions): Promise<CopyResult>;
export declare function downloadPng(blob: Blob, filename?: string): string;
//# sourceMappingURL=clipboard.d.ts.map