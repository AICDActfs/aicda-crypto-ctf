'use client';

interface ProgressBarProps {
  solvedCount: number;
  total: number;
}

export default function ProgressBar({ solvedCount, total }: ProgressBarProps) {
  const percentage = Math.round((solvedCount / total) * 100);

  return (
    <div className="w-full bg-black/80 border border-matrix-green/40 p-3 rounded">
      <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
        <span className="text-matrix-light">COMPLETION STATUS</span>
        <span className="text-matrix-green font-bold">{solvedCount} / {total} PWNED ({percentage}%)</span>
      </div>
      <div className="w-full bg-gray-950 h-3 rounded overflow-hidden border border-matrix-green/20">
        <div 
          className="bg-matrix-green h-full transition-all duration-500 shadow-[0_0_10px_#00ff41]" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
