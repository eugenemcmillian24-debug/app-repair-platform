import { useState, useEffect, useCallback } from 'react'
import { api } from './api'
import RepairForm from './components/RepairForm'
import RepairJob from './components/RepairJob'
import Dashboard from './components/Dashboard'
import Header from './components/Header'

export default function App() {
  const [tab, setTab] = useState('repair') // repair | history | dashboard
  const [activeJob, setActiveJob] = useState(null)
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState(null)
  const [backendStatus, setBackendStatus] = useState('checking')

  // Ping backend health
  useEffect(() => {
    api.health()
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus('offline'))
  }, [])

  // Poll active job
  useEffect(() => {
    if (!activeJob || ['done', 'failed'].includes(activeJob.status)) return
    const t = setInterval(async () => {
      try {
        const updated = await api.pollRepair(activeJob.job_id)
        setActiveJob(updated)
        if (['done', 'failed'].includes(updated.status)) {
          clearInterval(t)
          loadHistory()
        }
      } catch {}
    }, 2000)
    return () => clearInterval(t)
  }, [activeJob])

  const loadHistory = useCallback(async () => {
    try {
      const data = await api.history(30)
      setHistory(data.repairs || [])
    } catch {}
  }, [])

  const loadStats = useCallback(async () => {
    try {
      const data = await api.stats()
      setStats(data)
    } catch {}
  }, [])

  useEffect(() => {
    loadHistory()
    loadStats()
  }, [])

  const handleRepairSubmit = async (formData) => {
    const job = await api.startRepair(formData)
    setActiveJob(job)
    setTab('repair')
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Header backendStatus={backendStatus} />

      {/* Tabs */}
      <div className="border-b border-gray-800 px-6">
        <div className="flex gap-1 max-w-6xl mx-auto">
          {[
            { id: 'repair', label: '🔧 Repair' },
            { id: 'history', label: '📋 History' },
            { id: 'dashboard', label: '📊 Dashboard' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); if (t.id === 'history') loadHistory(); if (t.id === 'dashboard') loadStats(); }}
              className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {tab === 'repair' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <RepairForm onSubmit={handleRepairSubmit} disabled={activeJob && !['done','failed'].includes(activeJob?.status)} />
            {activeJob && <RepairJob job={activeJob} />}
          </div>
        )}
        {tab === 'history' && <HistoryTab history={history} onSelect={setActiveJob} />}
        {tab === 'dashboard' && <Dashboard stats={stats} history={history} />}
      </main>
    </div>
  )
}

function HistoryTab({ history, onSelect }) {
  if (!history.length)
    return <p className="text-gray-500 text-center py-16">No repairs yet. Submit your first bug above.</p>

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-200 mb-4">Repair History ({history.length})</h2>
      {[...history].reverse().map((job, i) => (
        <div
          key={i}
          onClick={() => onSelect(job)}
          className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-gray-600 transition-colors flex items-center justify-between"
        >
          <div>
            <span className="font-mono text-blue-400 text-sm">{job.repo}</span>
            <p className="text-gray-400 text-xs mt-0.5">{job.created_at?.slice(0, 16).replace('T', ' ')} UTC</p>
          </div>
          <StatusBadge status={job.status} />
        </div>
      ))}
    </div>
  )
}

export function StatusBadge({ status }) {
  const map = {
    done: 'bg-green-900 text-green-300',
    failed: 'bg-red-900 text-red-300',
    analyzing: 'bg-yellow-900 text-yellow-300',
    patching: 'bg-blue-900 text-blue-300',
    validating: 'bg-purple-900 text-purple-300',
    queued: 'bg-gray-800 text-gray-400',
  }
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${map[status] || 'bg-gray-800 text-gray-400'}`}>
      {status}
    </span>
  )
}
