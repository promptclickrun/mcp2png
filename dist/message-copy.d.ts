import type { CaptureOptions, ClipboardOptions, ElementLike, MessageCopyPart, MessageCopyOptions, MessageCopyResult } from './types.js';
export declare function buildMessageCopyPayload(parts: readonly MessageCopyPart[], options?: CaptureOptions): Promise<MessageCopyResult>;
export declare function copyMessageWithMcpApps(parts: readonly MessageCopyPart[], options?: MessageCopyOptions): Promise<MessageCopyResult>;
export declare function copyMessageElementWithInlineMcpApps(message: ElementLike, appSelector?: string, options?: MessageCopyOptions): Promise<MessageCopyResult>;
export declare function copyAppOnlyOrDownload(element: ElementLike, options?: CaptureOptions & ClipboardOptions): Promise<{
    ok: true;
    method: "clipboard";
    blob: Blob;
}>;
//# sourceMappingURL=message-copy.d.ts.map