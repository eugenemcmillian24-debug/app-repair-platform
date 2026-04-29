export default function Header({ backendStatus }) {
  return (
    <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛠️</span>
          <div>
            <h1 className="text-xl font-bold text-white">App Repair Platform</h1>
            <p className="text-xs text-gray-400">AI-powered bug detection & automated fixes</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${backendStatus === 'online' ? 'bg-green-400 animate-pulse' : backendStatus === 'offline' ? 'bg-red-400' : 'bg-yellow-400'}`} />
            <span className="text-xs text-gray-400">
              Backend {backendStatus === 'checking' ? '…' : backendStatus}
            </span>
          </div>
          <a
            href="https://github.com/eugenemcmillian24-debug/app-repair-platform"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            GitHub →
          </a>
        </div>
      </div>
    </header>
  )
}
