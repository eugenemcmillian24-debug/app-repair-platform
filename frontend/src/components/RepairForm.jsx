import { useState, useEffect } from 'react'
import { api } from '../api'

const MODELS = [
  { id: 'gpt4o', label: 'ChatGPT (GPT-4o)', badge: 'OpenAI' },
  { id: 'deepseek', label: 'DeepSeek-R1', badge: 'DeepSeek' },
  { id: 'llama', label: 'Llama 3.3 70B', badge: 'Meta/Ollama' },
]

export default function RepairForm({ onSubmit, disabled }) {
  const [form, setForm] = useState({
    repo_owner: '',
    repo_name: '',
    issue_number: '',
    error_description: '',
    file_path: '',
    code_snippet: '',
    model: 'gpt4o',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.error_description.trim()) { setError('Bug description is required'); return }
    setError(null)
    setLoading(true)
    try {
      await onSubmit({
        ...form,
        issue_number: form.issue_number ? parseInt(form.issue_number) : null,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-white mb-5">Submit Bug for Repair</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Repo */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">GitHub Owner</label>
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              placeholder="your-username"
              value={form.repo_owner}
              onChange={set('repo_owner')}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Repository</label>
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              placeholder="my-app"
              value={form.repo_name}
              onChange={set('repo_name')}
            />
          </div>
        </div>

        {/* Issue # + File */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Issue # (optional)</label>
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              placeholder="42"
              type="number"
              value={form.issue_number}
              onChange={set('issue_number')}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">File Path (optional)</label>
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              placeholder="src/utils.py"
              value={form.file_path}
              onChange={set('file_path')}
            />
          </div>
        </div>

        {/* Bug Description */}
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Bug Description *</label>
          <textarea
            rows={4}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
            placeholder="Describe the bug: what's happening, expected vs actual behavior, error messages..."
            value={form.error_description}
            onChange={set('error_description')}
            required
          />
        </div>

        {/* Code Snippet */}
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Code Snippet (optional but recommended)</label>
          <textarea
            rows={5}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono text-green-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
            placeholder="// Paste the buggy code here..."
            value={form.code_snippet}
            onChange={set('code_snippet')}
          />
        </div>

        {/* Model Selector */}
        <div>
          <label className="text-xs text-gray-400 mb-2 block">AI Model</label>
          <div className="grid grid-cols-3 gap-2">
            {MODELS.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setForm(f => ({ ...f, model: m.id }))}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  form.model === m.id
                    ? 'border-blue-500 bg-blue-900/30 text-blue-300'
                    : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500'
                }`}
              >
                <div className="text-xs font-medium">{m.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{m.badge} · Free</div>
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || disabled}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          {loading ? '⏳ Queueing repair…' : disabled ? '🔄 Repair in progress…' : '🚀 Start AI Repair'}
        </button>
      </form>
    </div>
  )
}
