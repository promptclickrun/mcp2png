import { Mcp2PngError } from './errors.js';
import { blobToDataUrl } from './dom.js';
import type { Mcp2PngExportHook, NormalizedCaptureOptions } from './types.js';

function timeoutAfter(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Mcp2PngError('EXPORT_HOOK_FAILED', `App export hook timed out after ${ms} ms.`));
    }, ms);
  });
}

export function getExportHook(element: Element): { hook: Mcp2PngExportHook; id?: string } | undefined {
  if (typeof window === 'undefined') return undefined;
  const hook = window.__mcp2pngExport;
  if (typeof hook !== 'function') return undefined;

  const id = element.getAttribute('data-mcp2png-export') ?? element.getAttribute('data-mcp-resource-id') ?? undefined;
  return id ? { hook, id } : { hook };
}

export async function runExportHook(element: Element, options: NormalizedCaptureOptions): Promise<string | undefined> {
  const exportHook = getExportHook(element);
  if (!exportHook) return undefined;

  try {
    const result = await Promise.race([
      Promise.resolve(exportHook.hook({ ...(exportHook.id ? { id: exportHook.id } : {}), element, options })),
      timeoutAfter(options.timeoutMs),
    ]);

    if (typeof result === 'string') {
      if (!result.startsWith('data:image/png')) {
        throw new Mcp2PngError('EXPORT_HOOK_FAILED', 'App export hook returned a string that is not a PNG data URL.');
      }
      return result;
    }

    if (result instanceof Blob) {
      if (result.type && result.type !== 'image/png') {
        throw new Mcp2PngError('EXPORT_HOOK_FAILED', `App export hook returned ${result.type}, expected image/png.`);
      }
      return blobToDataUrl(result);
    }

    throw new Mcp2PngError('EXPORT_HOOK_FAILED', 'App export hook returned an unsupported value.');
  } catch (error) {
    if (error instanceof Mcp2PngError) throw error;
    throw new Mcp2PngError('EXPORT_HOOK_FAILED', 'App export hook failed before returning a PNG.', { cause: error });
  }
}
