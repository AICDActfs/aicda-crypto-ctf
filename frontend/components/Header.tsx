'use client';
import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="w-full border-b border-matrix-green/30 bg-black/90 sticky top-0 z-40 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <Link href="/labs" className="flex items-center gap-3 group">
          <div className="relative w-11 h-11 rounded-full overflow-hidden border border-matrix-green shadow-[0_0_10px_rgba(0,255,65,0.4)]">
            <Image 
              src="/logo.png" 
              alt="AICDA Badge" 
              fill
              className="object-cover"
              priority
            />
          </div>
          <div>
            <span className="text-sm sm:text-base font-bold text-matrix-green tracking-wide glitch block">
              AICDA — Anonymous India Cyber Defence Academy
            </span>
            <span className="text-[11px] text-matrix-light font-mono block">
              ◈ CRYPTO PENTESTING LAB &nbsp;|&nbsp; KNOWLEDGE IS FREE
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-bold font-mono px-3 py-1.5 rounded border border-matrix-green/50 text-matrix-green bg-matrix-green/10">
            <span className="w-2 h-2 rounded-full bg-matrix-green animate-ping"></span>
            ▶ LIVE &nbsp;CTF IN PROGRESS
          </span>
        </div>
      </div>
    </header>
  );
}
