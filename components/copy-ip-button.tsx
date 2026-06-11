"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyIpButtonProps {
  ip: string;
  className?: string;
}

export default function CopyIpButton({ ip, className = "" }: CopyIpButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ip);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-200 cursor-pointer active:scale-95
        ${copied
          ? "bg-success-bg text-success-text border border-success-border"
          : "bg-ip-bg text-ip-text hover:text-foreground border border-ip-border hover:border-border-muted hover:bg-card-hover"
        } ${className}`}
      aria-label="复制服务器地址"
    >
      {copied ? (
        <><Check className="h-4 w-4" /><span>已复制</span></>
      ) : (
        <><Copy className="h-4 w-4" /><span>复制地址</span></>
      )}
    </button>
  );
}
