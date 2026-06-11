import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { siteConfig } from "@/config/site";
import CopyIpButton from "./copy-ip-button";

export default function Hero() {
  return (
    <div className="space-y-8 max-w-2xl animate-fade-up">
      <div className="space-y-4">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.08]">
          {siteConfig.serverName}
        </h1>
        {siteConfig.description && (
          <p className="text-lg sm:text-xl text-text-muted leading-relaxed font-light max-w-xl">
            {siteConfig.description}
          </p>
        )}
      </div>

      {/* 首页服务器 IP 醒目标识卡片 */}
      <div className="bg-card-bg border border-border-base rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 transition-colors duration-200">
        <div className="space-y-2 text-center sm:text-left">
          <h3 className="text-base font-bold text-foreground">服务器连接地址</h3>
          <p className="text-text-muted text-xs font-light">
            支持版本：<span className="text-emerald-500 font-semibold">{siteConfig.serverVersionDisplay}</span>
          </p>
          <p className="font-mono text-sm text-code-text bg-code-bg rounded-lg px-3 py-1.5 border border-code-border inline-block select-all">
            {siteConfig.serverAddress}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0">
          <Link
            href="/join"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-btn-bg text-btn-text font-medium text-sm transition-all duration-200 hover:bg-btn-hover active:scale-95 cursor-pointer text-center w-full sm:w-auto"
          >
            加入指引
            <ArrowRight className="h-4 w-4" />
          </Link>
          <CopyIpButton ip={siteConfig.serverAddress} className="w-full sm:w-auto" />
        </div>
      </div>
    </div>
  );
}
