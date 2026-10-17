'use client';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface TerminalBlockProps {
  command: string;
}

export default function TerminalBlock({ command }: TerminalBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-2">
      <div className="bg-black/95 border border-matrix-green/40 p-3 sm:p-4 rounded font-mono text-xs sm:text-sm text-matrix-green overflow-x-auto whitespace-pre break-normal">
        <span className="text-matrix-light select-none mr-2">$</span>
        {command}
      </div>
      <button 
        onClick={handleCopy}
        aria-label="Copy command"
        className="absolute top-2 right-2 p-1.5 bg-matrix-green/20 hover:bg-matrix-green text-matrix-green hover:text-black rounded border border-matrix-green/50 transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
