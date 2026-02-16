export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-6 py-20 text-center">
        {/* Logo/Brand */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold tracking-tight text-black dark:text-zinc-50">
            Open TA Tel-Yu
          </h1>
        </div>

        {/* Tagline */}
        <p className="mb-4 max-w-2xl text-xl text-zinc-600 dark:text-zinc-400">
          A Platform for Telkom University Alumni Research Papers
        </p>

        {/* Description */}
        <p className="mb-12 max-w-xl text-base text-zinc-500 dark:text-zinc-500">
          Discover, access, and discuss research papers from Telkom University
          alumni. Inspired by{" "}
          <a
            href="https://www.alphaxiv.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline dark:text-blue-400"
          >
            alphaXiv
          </a>{" "}
          and{" "}
          <a
            href="https://scispace.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline dark:text-blue-400"
          >
            SciSpace
          </a>
          , built for our academic community.
        </p>

        {/* Status Badge */}
        <div className="mb-16 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
          </span>
          Coming Soon
        </div>

        {/* What You'll Be Able To Do */}
        <div className="grid w-full max-w-3xl gap-6 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-3 text-2xl">📚</div>
            <h3 className="mb-2 font-semibold text-black dark:text-zinc-50">
              Browse Papers
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Access a centralized repository of alumni research papers
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-3 text-2xl">🔍</div>
            <h3 className="mb-2 font-semibold text-black dark:text-zinc-50">
              Search & Discover
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Find papers by topic, author, department, or year
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-3 text-2xl">💬</div>
            <h3 className="mb-2 font-semibold text-black dark:text-zinc-50">
              Discuss
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Engage with authors and peers through Q&A and comments
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 text-sm text-zinc-500 dark:text-zinc-500">
          <p>For Telkom University Alumni Community</p>
        </footer>
      </main>
    </div>
  );
}
