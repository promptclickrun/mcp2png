import { toBlob, toPng } from 'html-to-image';
import type { Options as HtmlToImageOptions } from 'html-to-image/lib/types.js';
import { classifyCaptureError, Mcp2PngError } from './errors.js';
import { dataUrlToBlob, resolveElement } from './dom.js';
import { runExportHook } from './export-hooks.js';
import { normalizeCaptureOptions } from './options.js';
import type { CaptureOptions, ElementLike, NormalizedCaptureOptions } from './types.js';

function toHtmlToImageOptions(normalized: NormalizedCaptureOptions): HtmlToImageOptions {
  const options: HtmlToImageOptions = {
    cacheBust: normalized.cacheBust,
    pixelRatio: normalized.pixelRatio,
    quality: normalized.quality,
    skipFonts: normalized.skipFonts,
  };

  if (normalized.backgroundColor !== 'transparent') options.backgroundColor = normalized.backgroundColor;
  if (normalized.filter) options.filter = normalized.filter;
  if (normalized.height !== undefined) options.height = normalized.height;
  if (normalized.style) options.style = normalized.style;
  if (normalized.width !== undefined) options.width = normalized.width;

  return options;
}

export async function elementToPngDataUrl(target: ElementLike, options: CaptureOptions = {}): Promise<string> {
  const element = resolveElement(target);
  const normalized = normalizeCaptureOptions(options);

  if (normalized.preferredExportHook) {
    const hooked = await runExportHook(element, normalized);
    if (hooked) return hooked;
  }

  try {
    return await toPng(element as HTMLElement, toHtmlToImageOptions(normalized));
  } catch (error) {
    throw classifyCaptureError(error);
  }
}

export async function elementToPngBlob(target: ElementLike, options: CaptureOptions = {}): Promise<Blob> {
  const element = resolveElement(target);
  const normalized = normalizeCaptureOptions(options);

  if (normalized.preferredExportHook) {
    const hooked = await runExportHook(element, normalized);
    if (hooked) return dataUrlToBlob(hooked);
  }

  try {
    const blob = await toBlob(element as HTMLElement, toHtmlToImageOptions(normalized));

    if (!blob) {
      throw new Mcp2PngError('CAPTURE_FAILED', 'Renderer returned null instead of a PNG blob.');
    }

    return blob.type === 'image/png' ? blob : blob.slice(0, blob.size, 'image/png');
  } catch (error) {
    throw classifyCaptureError(error);
  }
}
