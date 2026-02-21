// ───────────────────────────────────────────────────────────────────────────────
// Error UI: Error boundary for the chat page
// ───────────────────────────────────────────────────────────────────────────────

"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-2rem)]">
      <h2 className="text-xl font-semibold mb-2">Something went wrong!</h2>
      <p className="text-muted-foreground mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
