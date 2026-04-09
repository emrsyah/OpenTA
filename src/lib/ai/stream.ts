/**
 * SSE event formatting utilities.
 *
 * Formats events as newline-delimited JSON (NDJSON) that the frontend
 * use-streaming-chat.ts consumer already handles. The SSE contract is:
 *   data: {"type": "...", ...}\n\n  →  Python format
 *   {"type": "...", ...}\n          →  NDJSON format (what we emit)
 *
 * Both route.ts handlers currently emit NDJSON (raw JSON lines), and
 * the frontend parses them as JSON.parse(trimmed). We match that exactly.
 */

/**
 * Format a single SSE event as a JSON line (NDJSON).
 * The frontend use-streaming-chat.ts reads these with JSON.parse(trimmed).
 */
export function formatSSE(data: Record<string, unknown>): string {
  return `${JSON.stringify(data)}\n`;
}

/**
 * Format the stream termination signal.
 * Both route handlers emit `{"type": "finish"}` as the final event.
 */
export function formatFinish(): string {
  return formatSSE({ type: "finish" });
}

/**
 * Format a keepalive comment line.
 * Prevents reverse-proxy idle timeouts on long LLM streams.
 * SSE comments start with `:` and are ignored by EventSource parsers.
 */
export function formatKeepalive(): string {
  return ": keepalive\n\n";
}

/**
 * Create a TransformStream that converts SSE events to NDJSON bytes.
 * This is the standard pattern for Next.js streaming responses.
 */
export function createSSEStream(): TransformStream<string, Uint8Array> {
  const encoder = new TextEncoder();
  return new TransformStream<string, Uint8Array>({
    transform(chunk, controller) {
      controller.enqueue(encoder.encode(chunk));
    },
  });
}
