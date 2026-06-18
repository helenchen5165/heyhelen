'use client'

export default function ReaderError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col items-center justify-center gap-4 p-6">
      <p className="text-xs text-white/40 uppercase tracking-widest">Reader Error</p>
      <pre className="text-red-400 text-sm font-mono bg-black/40 rounded-lg px-4 py-3 max-w-xl w-full break-words whitespace-pre-wrap text-center">
        {error.message || String(error)}
      </pre>
      {error.digest && (
        <p className="text-xs text-white/20">digest: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="px-4 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20"
      >
        Try again
      </button>
    </div>
  )
}
