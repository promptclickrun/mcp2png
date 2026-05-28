import * as React from 'react';
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
export declare function useMcp2Png(options?: UseMcp2PngOptions): UseMcp2PngResult;
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
export declare function Mcp2PngControls({ target, className, labels, showDownload, onCopied, onError, ...options }: Mcp2PngControlsProps): React.ReactElement;
type ComponentType<P> = React.ComponentType<P>;
export interface Mcp2PngAppRendererProps<P extends object> {
    AppRenderer: ComponentType<P>;
    controls?: Omit<Mcp2PngControlsProps, 'target'> & {
        position?: 'before' | 'after' | 'none';
    };
    captureClassName?: string;
    exportId?: string;
    resource?: unknown;
    rendererProps?: P;
}
export declare function Mcp2PngAppRenderer<P extends object>({ AppRenderer, controls, captureClassName, exportId, resource, rendererProps, }: Mcp2PngAppRendererProps<P>): React.ReactElement;
export {};
//# sourceMappingURL=react.d.ts.map