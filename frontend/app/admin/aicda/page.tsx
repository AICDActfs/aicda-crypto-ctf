'use client';
import { useState, useEffect, useCallback } from 'react';
import Header from '../../../components/Header';
import MatrixRain from '../../../components/MatrixRain';
import { Download, RefreshCw, Trophy } from 'lucide-react';

interface Operative {
  rank: number;
  name: string;
  flagsSolved: number;
  flagsList: number[];
  score: number;
  lastActive: string;
  lastSolveTime: string;
}

export default function AdminCommandCenter() {
  const [password, setPassword] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const [authError, setAuthError] = useState('');
  const [operatives, setOperatives] = useState<Operative[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (localStorage.getItem('aicda_admin_auth') === 'authorized') {
      setIsAuth(true);
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const res = await fetch(`${apiUrl}/api/v1/leaderboard`);
      const data = await res.json();
      if (data.leaderboard) {
        setOperatives(data.leaderboard);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.error("Leaderboard poll error");
    }
  }, []);

  useEffect(() => {
    if (!isAuth) return;
    fetchLeaderboard();

    if (!autoRefresh) return;
    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, [isAuth, autoRefresh, fetchLeaderboard]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'AICDAadmin') {
      setIsAuth(true);
      localStorage.setItem('aicda_admin_auth', 'authorized');
      setAuthError('');
    } else {
      setAuthError('ACCESS DENIED: Invalid Administrative Credentials');
    }
  };

  const handleLogout = () => {
    setIsAuth(false);
    localStorage.removeItem('aicda_admin_auth');
  };

  const exportCSV = () => {
    if (operatives.length === 0) return;
    const headers = ["Rank,Operative Name,Flags Solved,Score,Solved Levels,Last Solve Time,Last Active\n"];
    const rows = operatives.map(o => 
      `"${o.rank}","${o.name}","${o.flagsSolved}","${o.score}","${o.flagsList.join(';') || 'None'}","${o.lastSolveTime}","${o.lastActive}"\n`
    );
    const blob = new Blob([...headers, ...rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aicda_crypto_leaderboard_${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <MatrixRain />
        <div className="glass-card max-w-sm w-full p-6 sm:p-8 rounded-lg border border-red-500/60 z-10 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-red-500 mb-2 font-mono">INSTRUCTOR ACCESS</h2>
          <p className="text-xs text-gray-400 mb-6 font-mono">AICDA Command & Control Portal</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin Security Key..."
              className="w-full bg-black/90 border border-red-500/50 p-2.5 text-red-400 rounded font-mono text-sm focus:outline-none focus:border-red-400"
              required
            />
            {authError && <p className="text-xs text-red-400 font-mono">{authError}</p>}
            <button 
              type="submit"
              className="w-full bg-red-950/80 hover:bg-red-900 border border-red-500 text-red-200 font-bold py-2.5 rounded font-mono text-xs uppercase tracking-wider transition-colors"
            >
              AUTHENTICATE →
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative pb-12">
      <MatrixRain />
      <Header />

      <main className="max-w-7xl mx-auto w-full px-4 pt-6 flex-1">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-matrix-green/30 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold glitch">INSTRUCTOR COMMAND CENTER</h1>
            <p className="text-xs text-matrix-light mt-1">
              Live Operative Surveillance • Last Sync: {lastUpdated || 'Connecting...'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border transition-all ${
                autoRefresh 
                  ? 'border-matrix-green text-matrix-green bg-matrix-green/10' 
                  : 'border-gray-600 text-gray-400'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'AUTO-POLL: 5s' : 'POLL PAUSED'}
            </button>

            <button 
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono bg-matrix-green text-black hover:bg-matrix-light font-bold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              EXPORT CSV
            </button>

            <button 
              onClick={handleLogout}
              className="px-3 py-1.5 rounded text-xs font-mono border border-red-500 text-red-400 hover:bg-red-500 hover:text-black transition-colors"
            >
              LOGOUT
            </button>
          </div>
        </div>

        <div className="glass-card rounded-lg overflow-hidden border border-matrix-green/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm font-mono min-w-[650px]">
              <thead>
                <tr className="border-b border-matrix-green/40 bg-black/60 text-matrix-light">
                  <th className="p-3 sm:p-4">RANK</th>
                  <th className="p-3 sm:p-4">OPERATIVE</th>
                  <th className="p-3 sm:p-4">PROGRESS</th>
                  <th className="p-3 sm:p-4">SCORE</th>
                  <th className="p-3 sm:p-4">PWNED LABS</th>
                  <th className="p-3 sm:p-4">LAST SOLVE</th>
                </tr>
              </thead>
              <tbody>
                {operatives.map((o) => (
                  <tr key={o.name} className="border-b border-matrix-green/20 hover:bg-matrix-green/5 transition-colors">
                    <td className="p-3 sm:p-4 font-bold">
                      {o.rank === 1 && <span className="text-yellow-400">🥇 #1</span>}
                      {o.rank === 2 && <span className="text-slate-300">🥈 #2</span>}
                      {o.rank === 3 && <span className="text-amber-600">🥉 #3</span>}
                      {o.rank > 3 && <span className="text-gray-400">#{o.rank}</span>}
                    </td>
                    <td className="p-3 sm:p-4 font-bold text-white flex items-center gap-2">
                      <Trophy className="w-3.5 h-3.5 text-matrix-green" />
                      {o.name}
                    </td>
                    <td className="p-3 sm:p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-950 h-2 rounded border border-matrix-green/30 overflow-hidden">
                          <div 
                            className="bg-matrix-green h-full" 
                            style={{ width: `${(o.flagsSolved / 10) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-matrix-green font-bold">{o.flagsSolved}/10</span>
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 font-bold text-matrix-light">{o.score} PTS</td>
                    <td className="p-3 sm:p-4 text-xs text-gray-400">
                      {o.flagsList.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {o.flagsList.map(lvl => (
                            <span key={lvl} className="px-1.5 py-0.5 rounded bg-matrix-green/20 text-matrix-green text-[10px] font-bold">
                              L{lvl}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-600">None</span>
                      )}
                    </td>
                    <td className="p-3 sm:p-4 text-xs text-gray-400">{o.lastSolveTime}</td>
                  </tr>
                ))}

                {operatives.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500 font-mono">
                      NO ACTIVE OPERATIVES RECORDED YET IN MAINFRAME DATABASE.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
