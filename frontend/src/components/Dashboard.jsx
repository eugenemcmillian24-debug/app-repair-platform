export default function Dashboard({ stats, history }) {
  if (!stats) return <p className="text-gray-500 text-center py-16">Loading stats…</p>

  const recent = [...(history || [])].reverse().slice(0, 10)

  const cards = [
    { label: 'Total Repairs', value: stats.total_repairs, color: 'text-blue-400' },
    { label: 'Success Rate', value: `${stats.success_rate}%`, color: 'text-green-400' },
    { label: 'PRs Created', value: stats.prs_created, color: 'text-purple-400' },
    { label: 'Active Jobs', value: stats.active_jobs, color: 'text-yellow-400' },
  ]

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-xs text-gray-400 mb-1">{c.label}</p>
            <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Model breakdown (from history) */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">AI Models Available</h3>
        <div className="space-y-3">
          {[
            { name: 'ChatGPT (GPT-4o)', provider: 'OpenAI via GitHub Models', tier: 'Free', color: 'bg-green-500' },
            { name: 'DeepSeek-R1', provider: 'DeepSeek via GitHub Models', tier: 'Free', color: 'bg-blue-500' },
            { name: 'Llama 3.3 70B', provider: 'Meta via GitHub (Ollama-compatible)', tier: 'Free', color: 'bg-purple-500' },
          ].map(m => (
            <div key={m.name} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${m.color}`} />
                <div>
                  <p className="text-sm text-white">{m.name}</p>
                  <p className="text-xs text-gray-500">{m.provider}</p>
                </div>
              </div>
              <span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded-full">{m.tier}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent repairs */}
      {recent.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Recent Repairs</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-800">
                <th className="text-left pb-2">Repo</th>
                <th className="text-left pb-2">Status</th>
                <th className="text-left pb-2">Time</th>
                <th className="text-left pb-2">PR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {recent.map((j, i) => (
                <tr key={i}>
                  <td className="py-2 font-mono text-blue-400 text-xs">{j.repo}</td>
                  <td className="py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${j.status === 'done' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>{j.status}</span></td>
                  <td className="py-2 text-gray-500 text-xs">{j.created_at?.slice(0, 16).replace('T', ' ')}</td>
                  <td className="py-2">
                    {j.result?.pr_url
                      ? <a href={j.result.pr_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">View →</a>
                      : <span className="text-gray-600 text-xs">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
