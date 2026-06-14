"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { MessageSquare, RefreshCw, Calendar, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Discussion {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  author: {
    minecraftId: string;
  };
  _count: {
    replies: number;
  };
}

interface DiscussionListProps {
  activeId?: string;
}

export default function DiscussionList({ activeId }: DiscussionListProps = {}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [highlightStyle, setHighlightStyle] = useState({
    top: 0,
    height: 0,
    opacity: 0,
  });

  useEffect(() => {
    const updateHighlight = () => {
      if (!containerRef.current) return;
      const activeEl = containerRef.current.querySelector(
        `[data-active="true"]`
      ) as HTMLElement;

      if (activeEl) {
        setHighlightStyle({
          top: activeEl.offsetTop,
          height: activeEl.offsetHeight,
          opacity: 1,
        });
      } else {
        setHighlightStyle((prev) => ({
          ...prev,
          opacity: 0,
        }));
      }
    };

    // Small timeout ensures the DOM layout has finalized before measuring offsets
    const timer = setTimeout(updateHighlight, 35);
    window.addEventListener("resize", updateHighlight);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateHighlight);
    };
  }, [activeId, discussions]);

  const fetchDiscussions = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await fetch("/api/discussions");
      if (!res.ok) {
        throw new Error("获取讨论列表失败");
      }
      const data = await res.json();
      setDiscussions(data);
    } catch (err) {
      console.error(err);
      setError("无法加载讨论，请稍后重试");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDiscussions();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-full h-24 p-5 rounded-2xl bg-card-bg border border-border-base animate-pulse flex flex-col justify-between"
          >
            <div className="h-4 w-2/3 bg-card-hover rounded" />
            <div className="flex gap-4">
              <div className="h-3 w-20 bg-card-hover rounded" />
              <div className="h-3 w-32 bg-card-hover rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-foreground tracking-tight flex items-center gap-2">
          讨论区
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchDiscussions(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center p-2 rounded-xl border border-border-base bg-card-bg text-text-muted hover:text-foreground hover:bg-card-hover transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50"
            title="刷新讨论列表"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>

          {session ? (
            <Link
              href="/discussions/new"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium text-xs transition-all duration-200 cursor-pointer active:scale-95 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>发布讨论</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-border-base bg-card-bg text-text-muted hover:text-foreground hover:bg-card-hover font-medium text-xs transition-all duration-200 cursor-pointer active:scale-95"
            >
              <span>登录后发布</span>
            </Link>
          )}
        </div>
      </div>

      {error ? (
        <div className="text-center py-12 border border-border-base rounded-2xl bg-card-bg text-danger text-sm">
          {error}
        </div>
      ) : discussions.length === 0 ? (
        <div className="text-center py-16 border border-border-base rounded-2xl bg-card-bg flex flex-col items-center justify-center gap-3 select-none">
          <MessageSquare className="h-10 w-10 text-text-light stroke-[1.5]" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">暂无讨论</p>
            <p className="text-xs text-text-muted">来发布服务器的第一个讨论吧！</p>
          </div>
          {session && (
            <Link
              href="/discussions/new"
              className="mt-2 inline-flex items-center justify-center gap-1 px-4 py-2 rounded-xl border border-border-base hover:bg-card-hover text-foreground font-medium text-xs transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>立即发布</span>
            </Link>
          )}
        </div>
      ) : (
        <div ref={containerRef} className="grid gap-3 relative">
          {/* Sliding Selection Highlight Box */}
          <div
            className="absolute left-0 right-0 border border-foreground ring-1 ring-foreground rounded-2xl bg-card-bg/20 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none z-10"
            style={{
              top: `${highlightStyle.top}px`,
              height: `${highlightStyle.height}px`,
              opacity: highlightStyle.opacity,
            }}
          />

          {discussions.map((d) => {
            const isActive = activeId === d.id;
            return (
              <Link
                key={d.id}
                href={`/discussions/${d.id}`}
                data-active={isActive ? "true" : "false"}
                className="group relative flex flex-col justify-between p-5 rounded-2xl bg-card-bg border border-border-base hover:border-border-muted hover:bg-card-hover transition-all duration-200 animate-fade-up cursor-pointer"
              >
              <div className="flex items-start justify-between gap-4 mb-2">
                <span className="text-sm font-medium text-foreground group-hover:underline tracking-tight block leading-snug transition-colors">
                  {d.title}
                </span>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-badge-bg border border-badge-border text-badge-text text-[10px] shrink-0 font-medium">
                  <MessageSquare className="h-3 w-3" />
                  <span>{d._count.replies}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-muted">
                <div className="flex items-center gap-1.5">
                  <img
                    src={`https://mc-heads.net/avatar/${d.author.minecraftId}/16`}
                    alt={d.author.minecraftId}
                    width={16}
                    height={16}
                    className="rounded-sm object-contain cursor-pointer hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(`/profile/${d.author.minecraftId}`);
                    }}
                  />
                  <span
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(`/profile/${d.author.minecraftId}`);
                    }}
                    className="font-medium text-text-light hover:text-foreground hover:underline cursor-pointer transition-colors"
                  >
                    {d.author.minecraftId}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-text-light" />
                  <span>
                    {d.createdAt === d.updatedAt
                      ? formatDate(d.createdAt)
                      : `更新于 ${formatDate(d.updatedAt)}`}
                  </span>
                </div>
              </div>
            </Link>
          ); })}
        </div>
      )}
    </div>
  );
}
