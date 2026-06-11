import { siteConfig } from "@/config/site";
import { Info } from "lucide-react";

export const metadata = {
  title: "关于",
  description: `关于 ${siteConfig.serverName} 服务器与本站信息。`,
};

export default function AboutPage() {
  return (
    <div className="py-20 px-6 max-w-4xl mx-auto flex-1">
      <div className="space-y-12 animate-fade-up">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">关于</h1>
          <p className="text-text-muted text-sm max-w-md mx-auto font-light">
            关于 {siteConfig.serverName} 与本站的基本信息。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card-bg border border-border-base rounded-2xl p-6 space-y-3 transition-colors duration-200">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-emerald-500" />
              <h3 className="font-semibold text-foreground">服务器信息</h3>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-muted font-light">名称</dt>
                <dd className="text-foreground font-medium">{siteConfig.serverName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted font-light">地址</dt>
                <dd className="text-foreground font-mono text-xs">{siteConfig.serverAddress}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted font-light">版本</dt>
                <dd className="text-foreground">{siteConfig.serverVersionDisplay}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-card-bg border border-border-base rounded-2xl p-6 space-y-3 transition-colors duration-200">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-emerald-500" />
              <h3 className="font-semibold text-foreground">关于本站</h3>
            </div>
            <p className="text-text-muted text-sm leading-relaxed font-light">
              本站为 {siteConfig.serverName} 的官方网站第一版，提供服务器状态监控和基本信息展示。更多功能将在后续版本中逐步上线。
            </p>
            <p className="text-text-light text-xs">
              Powered by Next.js · 本站与 Mojang / Microsoft 无关
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
