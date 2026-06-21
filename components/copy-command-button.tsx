"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyCommandButtonProps {
  command: string;
  className?: string;
}

// 传送指令一键复制按钮，风格对齐 components/copy-ip-button.tsx
export default function CopyCommandButton({ command, className = "" }: CopyCommandButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      title={command}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-xs transition-all duration-200 cursor-pointer active:scale-95 max-w-full
        ${copied
          ? "bg-success-bg text-success-text border border-success-border"
          : "bg-code-bg text-code-text border border-code-border hover:bg-card-hover hover:text-foreground"
        } ${className}`}
      aria-label={`复制传送指令 ${command}`}
    >
      <span className="truncate">{command}</span>
      {copied ? (
        <Check className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <Copy className="h-3.5 w-3.5 shrink-0" />
      )}
    </button>
  );
}
