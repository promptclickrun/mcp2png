import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { copyElementAsPng, downloadPng, elementToPngBlob } from './index.js';
export function useMcp2Png(options = {}) {
    const ref = React.useRef(null);
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [lastResult, setLastResult] = React.useState(null);
    const resolveTarget = React.useCallback((overrideTarget) => overrideTarget ?? options.target ?? ref, [options.target]);
    const copy = React.useCallback(async (overrideTarget) => {
        setBusy(true);
        setError(null);
        try {
            const result = await copyElementAsPng(resolveTarget(overrideTarget), options);
            setLastResult(result);
            return result;
        }
        catch (caught) {
            setError(caught);
            throw caught;
        }
        finally {
            setBusy(false);
        }
    }, [options, resolveTarget]);
    const download = React.useCallback(async (overrideTarget) => {
        setBusy(true);
        setError(null);
        try {
            const blob = await elementToPngBlob(resolveTarget(overrideTarget), options);
            const url = downloadPng(blob, options.fileName ?? options.fallbackFileName ?? 'mcp-app.png');
            return url;
        }
        catch (caught) {
            setError(caught);
            throw caught;
        }
        finally {
            setBusy(false);
        }
    }, [options, resolveTarget]);
    return { ref, busy, error, lastResult, copy, download };
}
export function Mcp2PngControls({ target, className, labels, showDownload = true, onCopied, onError, ...options }) {
    const api = useMcp2Png({ ...options, target });
    async function handleCopy() {
        try {
            const result = await api.copy(target);
            onCopied?.(result);
        }
        catch (error) {
            onError?.(error);
        }
    }
    async function handleDownload() {
        try {
            await api.download(target);
        }
        catch (error) {
            onError?.(error);
        }
    }
    return (_jsxs("div", { className: className, "data-mcp2png-controls": "true", children: [_jsx("button", { type: "button", disabled: api.busy, onClick: handleCopy, children: labels?.copy ?? 'Copy PNG' }), showDownload ? (_jsx("button", { type: "button", disabled: api.busy, onClick: handleDownload, children: labels?.download ?? 'Download PNG' })) : null] }));
}
export function Mcp2PngAppRenderer({ AppRenderer, controls, captureClassName, exportId, resource, rendererProps, }) {
    const captureRef = React.useRef(null);
    const controlPosition = controls?.position ?? 'after';
    const { position: _position, ...controlOptions } = controls ?? {};
    const props = { ...(rendererProps ?? {}), ...(resource === undefined ? {} : { resource }) };
    const controlElement = controlPosition === 'none' ? null : _jsx(Mcp2PngControls, { ...controlOptions, target: captureRef });
    return (_jsxs("div", { "data-mcp2png-wrapper": "true", children: [controlPosition === 'before' ? controlElement : null, _jsx("div", { ref: captureRef, className: captureClassName, "data-mcp2png-capture": "true", "data-mcp2png-export": exportId, children: _jsx(AppRenderer, { ...props }) }), controlPosition === 'after' ? controlElement : null] }));
}
//# sourceMappingURL=react.js.map