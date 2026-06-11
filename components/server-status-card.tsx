"use client";

import { useEffect, useState } from "react";
import { ServerStatusResponse } from "@/types/server-status";
import { Users, Cpu, Clock, RefreshCw, Server, WifiOff } from "lucide-react";
import { siteConfig } from "@/config/site";
import CopyIpButton from "./copy-ip-button";

export default function ServerStatusCard() {
  const [status, setStatus] = useState<ServerStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async (isSilent = false, forceRefresh = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    try {
      const url = forceRefresh ? "/api/server-status?force=true" : "/api/server-status";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("API error");
      const data: ServerStatusResponse = await res.json();
      setStatus(data);
    } catch {
      setStatus((prev) => prev || {
        online: false, host: siteConfig.serverIp, port: siteConfig.serverPort,
        motd: null, version: null, protocol: null,
        players: { online: 0, max: 0, sample: [] },
        latency: null, checkedAt: new Date().toISOString(), error: "Failed to connect",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => fetchStatus(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (iso?: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };  if (loading) {
    return (
      <div className="w-full max-w-md bg-card-bg border border-border-base rounded-2xl p-10 transition-colors duration-200">
        <div className="flex flex-col items-center justify-center gap-3">
          <RefreshCw className="h-6 w-6 text-text-light animate-spin" />
          <p className="text-text-muted text-sm font-light">正在连接服务器…</p>
        </div>
      </div>
    );
  }

  const isOnline = status?.online === true;
  const onlinePlayers = status?.players.online ?? 0;
  const maxPlayers = status?.players.max ?? 0;
  const version = status?.version || "未知";
  const latency = status?.latency;
  const motd = status?.motd;
  const playerPercent = maxPlayers > 0 ? Math.min((onlinePlayers / maxPlayers) * 100, 100) : 0;

  return (
    <div className="w-full max-w-md bg-card-bg border border-border-base rounded-2xl p-6 transition-all duration-200 animate-fade-in">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse-dot" : "bg-red-500"}`} />
          <span className="text-xs text-text-muted font-light">
            {isOnline ? "服务器在线" : "服务器离线"}
          </span>
        </div>
        <button
          onClick={() => fetchStatus(false, true)}
          className="p-1 text-text-light hover:text-foreground transition-colors cursor-pointer"
          disabled={refreshing || loading}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* 服务器地址 */}
      <div className="flex items-center justify-between bg-ip-bg border border-ip-border rounded-xl px-4 py-3 mb-5">
        <div className="flex items-center gap-2.5 min-w-0">
          <Server className="h-4 w-4 text-text-light shrink-0" />
          <p className="font-mono text-sm text-ip-text truncate">{siteConfig.serverAddress}</p>
        </div>
        <CopyIpButton ip={siteConfig.serverAddress} className="text-[11px] px-3 py-1.5" />
      </div>

      {isOnline ? (
        <div className="space-y-5">
          {/* MOTD */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-text-muted uppercase tracking-widest font-medium">MOTD</span>
            <div className="bg-code-bg border border-code-border rounded-xl p-3.5 font-mono text-xs text-code-text leading-relaxed select-all">
              {motd ? <p className="whitespace-pre-wrap">{motd}</p> : <p className="italic text-text-light">暂无数据</p>}
            </div>
          </div>

          {/* 在线人数 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-text-muted font-light">在线玩家</span>
              <span className="text-foreground font-mono">{onlinePlayers}<span className="text-text-light"> / </span>{maxPlayers}</span>
            </div>
            <div className="w-full h-1 bg-border-base rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${playerPercent}%` }} />
            </div>
          </div>

          {/* 玩家列表 */}
          {status?.players.sample && status.players.sample.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-text-muted uppercase tracking-widest font-medium">玩家列表</span>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {status.players.sample.map((name) => (
                  <span key={name} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-badge-bg border border-badge-border text-[11px] text-badge-text font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {onlinePlayers > 0 && (!status?.players.sample || status.players.sample.length === 0) && (
            <p className="text-[10px] text-text-light italic">* 无法获取玩家名单</p>
          )}

          {/* 元数据 */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border-base">
            <div className="space-y-1">
              <p className="text-[10px] text-text-muted font-light flex items-center gap-1"><Cpu className="h-3 w-3 text-text-light" />引擎</p>
              <p className="text-xs text-foreground font-medium truncate">{version}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-text-muted font-light flex items-center gap-1"><Clock className="h-3 w-3 text-text-light" />延迟</p>
              <p className="text-xs text-foreground font-mono flex items-center gap-1.5">
                {latency != null ? `${latency} ms` : "—"}
                {latency != null && (
                  <span className={`h-1.5 w-1.5 rounded-full ${latency < 50 ? "bg-emerald-500" : latency < 150 ? "bg-amber-500" : "bg-red-500"}`} />
                )}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
          <WifiOff className="h-8 w-8 text-text-light" />
          <p className="text-text-muted text-sm font-medium">连接已中断</p>
          <p className="text-text-light text-xs max-w-xs font-light">服务器可能已关闭，请稍后重试。</p>
        </div>
      )}

      {/* 底部时间 */}
      <div className="mt-5 pt-3 border-t border-border-base text-[10px] text-text-light flex justify-between">
        <span>30s 轮询</span>
        <span>{formatTime(status?.checkedAt)}</span>
      </div>
    </div>
  );
}
