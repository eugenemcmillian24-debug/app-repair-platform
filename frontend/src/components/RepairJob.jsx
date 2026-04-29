import { StatusBadge } from '../App'

const STEPS = ['queued', 'analyzing', 'patching', 'validating', 'done']

function StepIndicator({ current }) {
  const idx = STEPS.indexOf(current)
  return (
    <div className="flex items-center gap-1 mb-5">
      {STEPS.slice(0, -1).map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <div className={`w-2.5 h-2.5 rounded-full ${i < idx ? 'bg-green-400' : i === idx ? 'bg-blue-400 animate-pulse' : 'bg-gray-700'}`} />
          {i < STEPS.length - 2 && <div className={`h-0.5 w-6 ${i < idx ? 'bg-green-400' : 'bg-gray-700'}`} />}
        </div>
      ))}
      <div className={`w-2.5 h-2.5 rounded-full ${current === 'done' ? 'bg-green-400' : current === 'failed' ? 'bg-red-400' : 'bg-gray-700'}`} />
    </div>
  )
}

export default function RepairJob({ job }) {
  const result = job?.result || {}
  const diag = result?.diagnosis || {}

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Repair Job</h2>
        <StatusBadge status={job.status} />
      </div>

      <StepIndicator current={job.status} />

      <div className="text-xs text-gray-500 font-mono mb-4">
        ID: {job.job_id} · {job.repo} · {job.created_at?.slice(0, 16)} UTC
      </div>

      {/* Spinner while running */}
      {!['done', 'failed'].includes(job.status) && (
        <div className="flex items-center gap-3 py-4 text-gray-400 text-sm">
          <span className="animate-spin text-blue-400">⟳</span>
          {job.status === 'analyzing' && 'Analyzing root cause with AI…'}
          {job.status === 'patching' && 'Generating code patch…'}
          {job.status === 'validating' && 'Creating GitHub PR…'}
          {job.status === 'queued' && 'Queued, starting soon…'}
        </div>
      )}

      {/* Diagnosis */}
      {diag['ROOT CAUSE'] && (
        <div className="mt-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">🔍 Diagnosis</h3>
          <div className="bg-gray-800 rounded-lg p-4 space-y-2 text-sm">
            <p><span className="text-gray-400">Root cause:</span> <span className="text-white">{diag['ROOT CAUSE']}</span></p>
            <div className="flex gap-4 flex-wrap">
              {diag['SEVERITY'] && <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-yellow-300">severity: {diag['SEVERITY']}</span>}
              {diag['CATEGORY'] && <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-purple-300">type: {diag['CATEGORY']}</span>}
              {diag['CONFIDENCE'] && <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-green-300">confidence: {diag['CONFIDENCE']}%</span>}
            </div>
            {diag['SUGGESTED_FIX'] && <p className="text-gray-300 text-xs">{diag['SUGGESTED_FIX']}</p>}
          </div>
        </div>
      )}

      {/* Patch */}
      {result.patch && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">🩹 Generated Patch</h3>
          <pre className="bg-gray-950 border border-gray-800 rounded-lg p-4 text-xs font-mono text-green-300 overflow-x-auto max-h-48 overflow-y-auto">
            {result.patch}
          </pre>
        </div>
      )}

      {/* PR Link */}
      {result.pr_url && (
        <div className="mt-4">
          <a
            href={result.pr_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-900/40 border border-green-700 text-green-300 rounded-lg px-4 py-2 text-sm hover:bg-green-900/60 transition-colors"
          >
            ✅ View Pull Request on GitHub →
          </a>
        </div>
      )}

      {/* Error */}
      {job.status === 'failed' && result.error && (
        <div className="mt-4 bg-red-900/30 border border-red-800 rounded-lg p-4 text-sm text-red-300">
          ❌ {result.error}
        </div>
      )}
    </div>
  )
}
