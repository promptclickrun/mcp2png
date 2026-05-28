export type Mcp2PngErrorCode = 'NULL_ELEMENT' | 'INVALID_OPTIONS' | 'UNSUPPORTED_CLIPBOARD' | 'MISSING_USER_ACTIVATION' | 'CLIPBOARD_WRITE_FAILED' | 'EXPORT_HOOK_FAILED' | 'CAPTURE_FAILED' | 'TAINTED_CAPTURE' | 'DOWNLOAD_FAILED';
export declare class Mcp2PngError extends Error {
    readonly code: Mcp2PngErrorCode;
    readonly cause?: unknown;
    constructor(code: Mcp2PngErrorCode, message: string, options?: {
        cause?: unknown;
    });
}
/** @deprecated Use Mcp2PngError. Kept as a typo-tolerant alias for early prototypes. */
export declare const Mpc2PngError: typeof Mcp2PngError;
export type Mpc2PngError = Mcp2PngError;
export declare function isMcp2PngError(error: unknown): error is Mcp2PngError;
export declare function classifyCaptureError(error: unknown): Mcp2PngError;
//# sourceMappingURL=errors.d.ts.map