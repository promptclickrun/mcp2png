import * as React from 'react';
import { copyElementAsPng, downloadPng, elementToPngBlob } from './index.js';
import type { CaptureOptions, ClipboardOptions, CopyResult, ElementLike } from './types.js';

export interface UseMcp2PngOptions extends CaptureOptions, ClipboardOptions {
  fileName?: string;
  target?: ElementLike;
}

export interface UseMcp2PngResult {
  ref: React.RefObject<HTMLElement | null>;
  busy: boolean;
  error: unknown;
  lastResult: CopyResult | null;
  copy: (overrideTarget?: ElementLike) => Promise<CopyResult>;
  download: (overrideTarget?: ElementLike) => Promise<string>;
}

export function useMcp2Png(options: UseMcp2PngOptions = {}): UseMcp2PngResult {
  const ref = React.useRef<HTMLElement | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<unknown>(null);
  const [lastResult, setLastResult] = React.useState<CopyResult | null>(null);

  const resolveTarget = React.useCallback(
    (overrideTarget?: ElementLike): ElementLike => overrideTarget ?? options.target ?? ref,
    [options.target],
  );

  const copy = React.useCallback(
    async (overrideTarget?: ElementLike): Promise<CopyResult> => {
      setBusy(true);
      setError(null);
      try {
        const result = await copyElementAsPng(resolveTarget(overrideTarget), options);
        setLastResult(result);
        return result;
      } catch (caught) {
        setError(caught);
        throw caught;
      } finally {
        setBusy(false);
      }
    },
    [options, resolveTarget],
  );

  const download = React.useCallback(
    async (overrideTarget?: ElementLike): Promise<string> => {
      setBusy(true);
      setError(null);
      try {
        const blob = await elementToPngBlob(resolveTarget(overrideTarget), options);
        const url = downloadPng(blob, options.fileName ?? options.fallbackFileName ?? 'mcp-app.png');
        return url;
      } catch (caught) {
        setError(caught);
        throw caught;
      } finally {
        setBusy(false);
      }
    },
    [options, resolveTarget],
  );

  return { ref, busy, error, lastResult, copy, download };
}

export interface Mcp2PngControlsProps extends UseMcp2PngOptions {
  target: ElementLike;
  className?: string;
  labels?: {
    copy?: string;
    download?: string;
  };
  showDownload?: boolean;
  onCopied?: (result: CopyResult) => void;
  onError?: (error: unknown) => void;
}

export function Mcp2PngControls({
  target,
  className,
  labels,
  showDownload = true,
  onCopied,
  onError,
  ...options
}: Mcp2PngControlsProps): React.ReactElement {
  const api = useMcp2Png({ ...options, target });

  async function handleCopy(): Promise<void> {
    try {
      const result = await api.copy(target);
      onCopied?.(result);
    } catch (error) {
      onError?.(error);
    }
  }

  async function handleDownload(): Promise<void> {
    try {
      await api.download(target);
    } catch (error) {
      onError?.(error);
    }
  }

  return (
    <div className={className} data-mcp2png-controls="true">
      <button type="button" disabled={api.busy} onClick={handleCopy}>
        {labels?.copy ?? 'Copy PNG'}
      </button>
      {showDownload ? (
        <button type="button" disabled={api.busy} onClick={handleDownload}>
          {labels?.download ?? 'Download PNG'}
        </button>
      ) : null}
    </div>
  );
}

type ComponentType<P> = React.ComponentType<P>;

export interface Mcp2PngAppRendererProps<P extends object> {
  AppRenderer: ComponentType<P>;
  controls?: Omit<Mcp2PngControlsProps, 'target'> & { position?: 'before' | 'after' | 'none' };
  captureClassName?: string;
  exportId?: string;
  resource?: unknown;
  rendererProps?: P;
}

export function Mcp2PngAppRenderer<P extends object>({
  AppRenderer,
  controls,
  captureClassName,
  exportId,
  resource,
  rendererProps,
}: Mcp2PngAppRendererProps<P>): React.ReactElement {
  const captureRef = React.useRef<HTMLDivElement | null>(null);
  const controlPosition = controls?.position ?? 'after';
  const { position: _position, ...controlOptions } = controls ?? {};
  const props = { ...(rendererProps ?? ({} as P)), ...(resource === undefined ? {} : { resource }) } as P;

  const controlElement =
    controlPosition === 'none' ? null : <Mcp2PngControls {...controlOptions} target={captureRef} />;

  return (
    <div data-mcp2png-wrapper="true">
      {controlPosition === 'before' ? controlElement : null}
      <div
        ref={captureRef}
        className={captureClassName}
        data-mcp2png-capture="true"
        data-mcp2png-export={exportId}
      >
        <AppRenderer {...props} />
      </div>
      {controlPosition === 'after' ? controlElement : null}
    </div>
  );
}
