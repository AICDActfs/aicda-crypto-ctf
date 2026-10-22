'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import MatrixRain from '../../components/MatrixRain';
import LabCard from '../../components/LabCard';
import FlagSubmitModal from '../../components/FlagSubmitModal';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://aicda-crypto-api.onrender.com';

const LABS = [
  { level: 1, title: 'AES-CBC Bit-Flipping Attack', category: 'BLOCK CIPHER MALLEABILITY', points: 100, slug: 'cbc-bit-flipping' },
  { level: 2, title: 'PKCS#7 Padding Oracle Exploit', category: 'SIDE-CHANNEL ERROR ORACLE', points: 100, slug: 'padding-oracle' },
  { level: 3, title: 'AES-ECB Byte-at-a-Time Attack', category: 'CHOSEN-PLAINTEXT ALIGNMENT', points: 100, slug: 'ecb-byte-at-a-time' },
  { level: 4, title: 'Stream Cipher Nonce Reuse', category: 'KEYSTREAM ELIMINATION XOR', points: 100, slug: 'nonce-reuse' },
  { level: 5, title: 'PRNG Predictability & Token Hijack', category: 'UNSEEDED PSEUDORANDOM GENERATOR', points: 100, slug: 'prng-predictability' },
  { level: 6, title: 'Hash Length Extension (MD5/SHA1)', category: 'MERKLE-DAMGÅRD CONSTRUCTION', points: 100, slug: 'hash-length-extension' },
  { level: 7, title: 'JWT None & Algorithm Confusion', category: 'TOKEN SIGNATURE CONFUSION', points: 100, slug: 'jwt-algorithm-confusion' },
  { level: 8, title: 'Bleichenbacher RSA e=3 Forgery', category: 'LOW PUBLIC EXPONENT CUBE ROOT', points: 100, slug: 'bleichenbacher-rsa' },
  { level: 9, title: 'Microsecond Timing Attack', category: 'SIDE-CHANNEL STRING DELAY', points: 100, slug: 'timing-attack' },
  { level: 10, title: 'Flawed PBKDF2 & Static Salt', category: 'LOW WORK-FACTOR KEY DERIVATION', points: 100, slug: 'weak-pbkdf2' },
];

export default function LabsDashboard() {
  const router = useRouter();
  const [solved, setSolved] = useState<Record<number, boolean>>({});
  const [studentName, setStudentName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const syncSolvedProgress = useCallback(async (name: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/user-progress?student_name=${encodeURIComponent(name)}`);
      const data = await res.json();
      if (data.solved) {
        const state: Record<number, boolean> = {};
        data.solved.forEach((lvl: number) => { state[lvl] = true; });
        setSolved(state);
      }
    } catch (e) {
      console.warn("Using offline progress cache.");
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('aicda_crypto_token');
    const name = localStorage.getItem('aicda_student_name') || 'operative';
    if (!token) {
      router.push('/');
      return;
    }
    setStudentName(name);
    syncSolvedProgress(name);
  }, [router, syncSolvedProgress]);

  const handleResetMyFlags = async () => {
    if (!window.confirm("⚠️ ARE YOU SURE? This will reset all your solved flags on the mainframe and admin leaderboard!")) {
      return;
    }
    setIsResetting(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/reset-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_name: studentName })
      });
      if (res.ok) {
        setSolved({});
        alert("SUCCESS: All flags have been reset to 0/10.");
      } else {
        alert("Server returned error resetting flags.");
      }
    } catch (err) {
      // Even if network blips, reset client-side
      setSolved({});
      alert("Flags reset locally in your active session.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('aicda_crypto_token');
    localStorage.removeItem('aicda_student_name');
    router.push('/');
  };

  const solvedCount = Object.values(solved).filter(Boolean).length;
  const isAllSolved = solvedCount === 10;
  const currentPoints = solvedCount * 100;
  const progressPercent = (solvedCount / 10) * 100;

  return (
    <div className="min-h-screen flex flex-col relative pb-20">
      <MatrixRain />
      <Header />

      <main className="max-w-7xl mx-auto w-full px-4 pt-6 flex-1">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-[11px] text-gray-400 font-mono block uppercase">CURRENT SESSION</span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-white tracking-wide">{studentName}</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <button 
              onClick={handleResetMyFlags}
              disabled={isResetting}
              className="px-3.5 py-1.5 border border-red-500 text-red-500 hover:bg-red-500/20 font-bold rounded transition-colors"
            >
              {isResetting ? 'RESETTING...' : 'RESET FLAGS'}
            </button>
            <button 
              onClick={handleLogout}
              className="px-3.5 py-1.5 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 font-bold rounded transition-colors"
            >
              LOGOUT
            </button>
          </div>
        </div>

        <div className="bg-black/80 border border-matrix-green/40 p-4 rounded-lg mb-6 shadow-[0_0_15px_rgba(0,255,65,0.15)]">
          <div className="flex justify-between items-center text-xs sm:text-sm font-mono mb-2">
            <span className="text-matrix-light font-bold">OPERATIONAL PROGRESS ({solvedCount}/10)</span>
            <span className="text-matrix-green font-bold">{currentPoints} / 1000 PTS</span>
          </div>
          <div className="w-full bg-gray-950 h-3.5 rounded-full overflow-hidden border border-matrix-green/30">
            <div 
              className="bg-matrix-light h-full rounded-full transition-all duration-500 shadow-[0_0_15px_#00ffff]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {isAllSolved && (
          <div className="border border-matrix-green bg-black/90 p-6 rounded-lg text-center mb-8 shadow-[0_0_25px_rgba(0,255,65,0.3)]">
            <h2 className="text-2xl font-bold glitch text-white mb-2">
              🎉 ALL MISSION MODULES COMPROMISED!
            </h2>
            <p className="text-sm text-matrix-light font-mono mb-4">
              Outstanding work, {studentName}. All 10 challenge flags verified.
            </p>
            <button 
              onClick={handleResetMyFlags}
              className="bg-pink-700 hover:bg-pink-600 text-white font-mono font-bold text-xs uppercase px-5 py-2.5 rounded transition-colors"
            >
              RESET LABS TO PRACTICE AGAIN
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12">
          {LABS.map((lab) => (
            <LabCard 
              key={lab.level}
              {...lab}
              solved={!!solved[lab.level]}
            />
          ))}
        </div>

        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-8 py-3.5 bg-matrix-green text-black font-bold font-mono text-sm sm:text-base rounded-md hover:bg-matrix-light shadow-[0_0_20px_#00ff41] transition-all transform hover:scale-105"
          >
            🚩 SUBMIT FLAG
          </button>
        </div>
      </main>

      <FlagSubmitModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSubmitSuccess={(level) => {
          setSolved(prev => ({ ...prev, [level]: true }));
        }}
      />
    </div>
  );
}
