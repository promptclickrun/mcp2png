import type { Options as HtmlToImageOptions } from 'html-to-image/lib/types.js';

export type ElementLike = Element | null | undefined | { current: Element | null | undefined };

export interface Mcp2PngExportRequest {
  id?: string;
  element: Element;
  options: NormalizedCaptureOptions;
}

export type Mcp2PngExportResult = Blob | string | Promise<Blob | string>;

export type Mcp2PngExportHook = (request: Mcp2PngExportRequest) => Mcp2PngExportResult;

declare global {
  interface Window {
    __mcp2pngExport?: Mcp2PngExportHook;
  }
}

export interface CaptureOptions {
  /** PNG background. Use `transparent` to preserve alpha where supported. */
  backgroundColor?: string;
  /** Cache-bust external assets before capture. Defaults to true. */
  cacheBust?: boolean;
  /** Optional DOM filter passed through to html-to-image. */
  filter?: (node: Element) => boolean;
  /** Override output height in CSS pixels. */
  height?: number;
  /** Output scale. Defaults to 2 for crisp chat cards. */
  pixelRatio?: number;
  /** Try app-provided export hooks before host-side DOM capture. Defaults to true. */
  preferredExportHook?: boolean;
  /** Force host-side DOM capture and ignore app-provided export hooks. Useful when copy must match the currently visible rendered card exactly. */
  forceDomCapture?: boolean;
  /** Quality hint for compatible renderers. PNG is lossless, but dependency accepts the option. */
  quality?: number;
  /** Skip font embedding when it causes CORS issues. Defaults to false. */
  skipFonts?: boolean;
  /** Inline style overrides applied during capture. */
  style?: HtmlToImageOptions['style'];
  /** Abort slow capture/export hooks after this many ms. Defaults to 10000. */
  timeoutMs?: number;
  /** Override output width in CSS pixels. */
  width?: number;
}

export interface NormalizedCaptureOptions {
  backgroundColor: string;
  cacheBust: boolean;
  filter: ((node: Element) => boolean) | undefined;
  height: number | undefined;
  pixelRatio: number;
  preferredExportHook: boolean;
  forceDomCapture: boolean;
  quality: number;
  skipFonts: boolean;
  style: HtmlToImageOptions['style'] | undefined;
  timeoutMs: number;
  width: number | undefined;
}

export interface ClipboardOptions {
  /** Require browser transient user activation before writing. Defaults to true. */
  requireUserActivation?: boolean;
  /** If clipboard write fails, download the PNG instead. Defaults to false. */
  fallbackToDownload?: boolean;
  /** File name used by fallback download. */
  fallbackFileName?: string;
}

export interface NormalizedClipboardOptions {
  requireUserActivation: boolean;
  fallbackToDownload: boolean;
  fallbackFileName: string;
}

export interface ClipboardSupport {
  hasClipboardItem: boolean;
  hasNavigatorClipboardWrite: boolean;
  canWritePng: boolean;
}

export interface CopyElementOptions extends CaptureOptions, ClipboardOptions {
  fileName?: string;
}

export interface CopyResult {
  ok: true;
  method: 'clipboard' | 'download';
  blob: Blob;
}

export type MessageCopyPart =
  | { type: 'html'; html: string; text?: string }
  | { type: 'text'; text: string }
  | {
      type: 'mcp-app';
      element: ElementLike;
      id?: string;
      alt?: string;
      className?: string;
      captureOptions?: CaptureOptions;
    };

export interface MessageCopyOptions extends CaptureOptions {
  /** Clipboard behavior for the final rich text/html write. */
  clipboard?: ClipboardOptions;
}

export interface MessageCopyResult {
  ok: true;
  method: 'html';
  /** Rich clipboard HTML with every MCP App replaced by an inline PNG img tag. */
  html: string;
  /** Plain-text clipboard fallback preserving the same surrounding message order. */
  text: string;
}
