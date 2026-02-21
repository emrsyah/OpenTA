// ───────────────────────────────────────────────────────────────────────────────
// Loading UI: Suspense boundary fallback for the chat page
// ───────────────────────────────────────────────────────────────────────────────

export default function Loading() {
  return (
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm">Loading conversation...</p>
        </div>
      </div>
    </div>
  );
}
