import type { ElementLike } from './types.js';
export declare function resolveElement(target: ElementLike): Element;
export declare function dataUrlToBlob(dataUrl: string): Blob;
export declare function blobToDataUrl(blob: Blob): Promise<string>;
export declare function buildFileName(input: string | undefined, fallback?: string): string;
//# sourceMappingURL=dom.d.ts.map