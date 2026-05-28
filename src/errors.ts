export type Mcp2PngErrorCode =
  | 'NULL_ELEMENT'
  | 'INVALID_OPTIONS'
  | 'UNSUPPORTED_CLIPBOARD'
  | 'MISSING_USER_ACTIVATION'
  | 'CLIPBOARD_WRITE_FAILED'
  | 'EXPORT_HOOK_FAILED'
  | 'CAPTURE_FAILED'
  | 'TAINTED_CAPTURE'
  | 'DOWNLOAD_FAILED';

export class Mcp2PngError extends Error {
  readonly code: Mcp2PngErrorCode;
  readonly cause?: unknown;

  constructor(code: Mcp2PngErrorCode, message: string, options: { cause?: unknown } = {}) {
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
export type Mpc2PngError = Mcp2PngError;

export function isMcp2PngError(error: unknown): error is Mcp2PngError {
  return error instanceof Mcp2PngError;
}

export function classifyCaptureError(error: unknown): Mcp2PngError {
  if (error instanceof Mcp2PngError) return error;

  const message = error instanceof Error ? error.message : String(error);
  const name = error instanceof Error ? error.name : '';
  const lower = `${name} ${message}`.toLowerCase();

  if (
    lower.includes('taint') ||
    lower.includes('cross-origin') ||
    lower.includes('cross origin') ||
    lower.includes('securityerror') ||
    lower.includes('security error')
  ) {
    return new Mcp2PngError(
      'TAINTED_CAPTURE',
      'Could not capture the element because the rendered content appears to include tainted or cross-origin resources.',
      { cause: error },
    );
  }

  return new Mcp2PngError('CAPTURE_FAILED', `Could not render the element to PNG: ${message}`, { cause: error });
}
