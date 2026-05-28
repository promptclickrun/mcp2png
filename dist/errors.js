export class Mcp2PngError extends Error {
    code;
    cause;
    constructor(code, message, options = {}) {
        super(message);
        this.name = 'Mcp2PngError';
        this.code = code;
        if ('cause' in options) {
            this.cause = options.cause;
        }
    }
}
/** @deprecated Use Mcp2PngError. Kept as a typo-tolerant alias for early prototypes. */
export const Mpc2PngError = Mcp2PngError;
export function isMcp2PngError(error) {
    return error instanceof Mcp2PngError;
}
export function classifyCaptureError(error) {
    if (error instanceof Mcp2PngError)
        return error;
    const message = error instanceof Error ? error.message : String(error);
    const name = error instanceof Error ? error.name : '';
    const lower = `${name} ${message}`.toLowerCase();
    if (lower.includes('taint') ||
        lower.includes('cross-origin') ||
        lower.includes('cross origin') ||
        lower.includes('securityerror') ||
        lower.includes('security error')) {
        return new Mcp2PngError('TAINTED_CAPTURE', 'Could not capture the element because the rendered content appears to include tainted or cross-origin resources.', { cause: error });
    }
    return new Mcp2PngError('CAPTURE_FAILED', `Could not render the element to PNG: ${message}`, { cause: error });
}
//# sourceMappingURL=errors.js.map