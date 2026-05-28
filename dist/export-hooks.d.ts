import type { Mcp2PngExportHook, NormalizedCaptureOptions } from './types.js';
export declare function getExportHook(element: Element): {
    hook: Mcp2PngExportHook;
    id?: string;
} | undefined;
export declare function runExportHook(element: Element, options: NormalizedCaptureOptions): Promise<string | undefined>;
//# sourceMappingURL=export-hooks.d.ts.map