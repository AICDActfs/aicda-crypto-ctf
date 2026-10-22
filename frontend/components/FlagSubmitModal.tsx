'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://aicda-crypto-api.onrender.com';

interface FlagSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: (level: number) => void;
}

export default function FlagSubmitModal({ isOpen, onClose, onSubmitSuccess }: FlagSubmitModalProps) {
  const [level, setLevel] = useState<number>(1);
  const [flag, setFlag] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flag.trim()) return;

    setLoading(true);
    setMessage('');
    setIsError(false);

    const studentName = localStorage.getItem('aicda_student_name') || 'operative';

    try {
      const res = await fetch(`${API_BASE}/api/v1/submit-flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_name: studentName, level, flag: flag.trim() })
      });
      const data = await res.json();

      if (res.ok && data.correct) {
        setIsError(false);
        setMessage(`SUCCESS: Level ${level} PWNED!`);
        onSubmitSuccess(level);
        setTimeout(() => {
          setFlag('');
          setMessage('');
          onClose();
        }, 1000);
      } else {
        setIsError(true);
        setMessage(data.message || 'ACCESS DENIED: Invalid flag');
      }
    } catch (err) {
      setIsError(true);
      setMessage('CONNECTION FAILED: Check API status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass-card w-full max-w-lg p-6 rounded relative border border-matrix-green"
        >
          <div className="flex justify-between items-center mb-4 border-b border-matrix-green/30 pb-3">
            <h2 className="text-xl font-bold glitch">AUTHENTICATE SYSTEM PWN</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white font-mono text-sm"
            >
              [ESC / ✕]
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-matrix-light mb-1.5">TARGET LEVEL</label>
              <select 
                value={level} 
                onChange={(e) => setLevel(Number(e.target.value))}
                className="w-full bg-black/90 border border-matrix-green p-2.5 text-matrix-green rounded font-mono text-sm focus:outline-none focus:border-matrix-light"
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Level {i + 1}: {
                      [
                        'AES-CBC Bit-Flipping',
                        'PKCS#7 Padding Oracle',
                        'AES-ECB Byte-at-a-Time',
                        'Stream Cipher Nonce Reuse',
                        'PRNG Predictability',
                        'Hash Length Extension',
                        'JWT None & Key Confusion',
                        'Bleichenbacher RSA e=3',
                        'Microsecond Timing Attack',
                        'Flawed PBKDF2 & Static Salt'
                      ][i]
                    }
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-matrix-light mb-1.5">ENTER FLAG (flag&#123;...&#125;)</label>
              <input 
                type="text" 
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                placeholder="flag{...}"
                className="w-full bg-black/90 border border-matrix-green p-2.5 text-matrix-green rounded font-mono text-sm focus:outline-none focus:border-matrix-light"
              />
            </div>

            {message && (
              <p className={`text-xs font-mono p-2 rounded ${isError ? 'bg-red-950/80 text-red-400 border border-red-500' : 'bg-green-950/80 text-matrix-green border border-matrix-green'}`}>
                {message}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-600 hover:border-gray-400 text-gray-300 py-2.5 rounded font-mono text-xs uppercase"
              >
                CANCEL
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="flex-1 bg-matrix-green text-black hover:bg-matrix-light font-bold py-2.5 rounded font-mono text-xs uppercase transition-colors"
              >
                {loading ? 'VERIFYING...' : 'CONFIRM PWN'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
