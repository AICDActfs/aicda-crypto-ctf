'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import MatrixRain from '../components/MatrixRain';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const [studentName, setStudentName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem('aicda_crypto_token')) {
      router.push('/labs');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setError('Operative identity is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName: studentName.trim(), code: code.trim() })
      });
      const data = await res.json();

      if (data.valid) {
        localStorage.setItem('aicda_crypto_token', data.token);
        localStorage.setItem('aicda_student_name', studentName.trim());
        router.push('/labs');
      } else {
        setError('ACCESS DENIED: Invalid Access Code');
      }
    } catch (err) {
      setError('Connection failure to authentication provider');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <MatrixRain />
      
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-md p-6 sm:p-8 glass-card rounded-lg text-center"
      >
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-4 rounded-full overflow-hidden border-2 border-matrix-green shadow-[0_0_20px_rgba(0,255,65,0.4)]">
          <Image 
            src="/logo.png" 
            alt="AICDA Cyber Badge" 
            fill
            className="object-cover"
            priority
          />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold glitch mb-1">AICDA CRYPTO LABS</h1>
        <p className="text-xs sm:text-sm text-matrix-light mb-6">Production Cryptography Pentesting Mainframe</p>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-mono text-matrix-light mb-1.5">{'//'} OPERATIVE NAME</label>
            <input 
              type="text" 
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="e.g. akash"
              className="w-full bg-black/80 border border-matrix-green p-3 text-matrix-green rounded font-mono text-sm focus:outline-none focus:border-matrix-light"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-matrix-light mb-1.5">{'//'} MAIN ACCESS CODE</label>
            <input 
              type="password" 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter Access Code..."
              className="w-full bg-black/80 border border-matrix-green p-3 text-matrix-green rounded font-mono text-sm focus:outline-none focus:border-matrix-light"
              required
            />
          </div>

          {error && <p className="text-xs text-red-400 font-mono bg-red-950/60 p-2 rounded border border-red-500/50">{error}</p>}

          <button 
            type="submit"
            disabled={loading}
            className="w-full border-2 border-matrix-green text-matrix-green hover:bg-matrix-green hover:text-black font-bold py-3 rounded font-mono text-xs sm:text-sm uppercase transition-colors tracking-wider shadow-[0_0_10px_rgba(0,255,65,0.2)]"
          >
            {loading ? 'INITIALIZING...' : 'INITIALIZE SEQUENCE →'}
          </button>
        </form>

        <p className="text-[10px] text-gray-500 mt-6 tracking-widest font-mono">
          KNOWLEDGE IS FREE. WE ARE ANONYMOUS. WE ARE LEGION.
        </p>
      </motion.div>
    </main>
  );
}
