"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, User, MessageSquare, AlertCircle, Shield, Download, RefreshCw } from "lucide-react";

interface UserProfile {
  id: string;
  minecraftId: string;
  role: string;
  createdAt: string;
  discussions: {
    id: string;
    title: string;
    createdAt: string;
    _count: {
      replies: number;
    };
  }[];
  _count: {
    discussions: number;
    replies: number;
    votes: number;
  };
}

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const router = useRouter();
  const { username } = use(params);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/${username}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("该玩家在网站尚未注册");
        }
        throw new Error("获取个人中心数据失败");
      }
      const data = await res.json();
      setProfile(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "加载失败，请检查网络连接");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex-grow bg-background py-10 animate-fade-in">
        <div className="max-w-5xl mx-auto px-6 space-y-6">
          <div className="h-8 w-24 bg-card-bg border border-border-base rounded-xl animate-pulse" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {/* Left Skeleton */}
            <div className="md:col-span-1 rounded-3xl border border-border-base bg-card-bg p-8 h-[400px] animate-pulse" />
            
            {/* Right Skeleton */}
            <div className="md:col-span-2 space-y-6">
              <div className="space-y-3">
                <div className="h-8 w-1/3 bg-card-hover rounded-lg animate-pulse" />
                <div className="h-4 w-1/4 bg-card-hover rounded-md animate-pulse" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-card-bg border border-border-base rounded-2xl animate-pulse" />
                ))}
              </div>
              <div className="space-y-4">
                <div className="h-5 w-40 bg-card-hover rounded-md animate-pulse" />
                <div className="h-16 bg-card-bg border border-border-base rounded-2xl animate-pulse" />
                <div className="h-16 bg-card-bg border border-border-base rounded-2xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex-grow bg-background py-12 animate-fade-in">
        <div className="max-w-md mx-auto px-6 text-center space-y-5">
          <AlertCircle className="h-12 w-12 text-danger mx-auto animate-bounce" />
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">无法加载玩家中心</h2>
            <p className="text-xs text-text-muted">{error || "数据未找到"}</p>
          </div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-foreground hover:bg-card-hover px-4 py-2 border border-border-base rounded-xl transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>返回上一页</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow bg-background py-10 animate-fade-in">
      <div className="max-w-5xl mx-auto px-6 space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-foreground hover:bg-card-hover px-3 py-1.5 border border-border-base rounded-xl transition-all duration-200 cursor-pointer active:scale-95 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>返回</span>
          </button>
          
          <button
            onClick={fetchProfile}
            className="inline-flex items-center justify-center p-2 rounded-xl border border-border-base bg-card-bg text-text-muted hover:text-foreground hover:bg-card-hover transition-all duration-200 cursor-pointer active:scale-95"
            title="重新加载"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Left Pane - Skin display */}
          <div className="md:col-span-1 relative overflow-hidden rounded-3xl border border-border-base bg-card-bg shadow-sm p-8 flex flex-col items-center justify-center min-h-[400px] group">
            {/* Elegant HSL Tailored Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-tr from-success-bg/20 via-card-hover to-warning-bg/15 group-hover:scale-105 transition-transform duration-700" />
            
            {/* Floating blurry light orbs */}
            <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-success-text/5 blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-32 h-32 rounded-full bg-warning-text/5 blur-3xl pointer-events-none" />

            <div className="relative z-10 hover:scale-[1.05] transition-transform duration-300 select-none">
              <img
                src={`https://mc-heads.net/player/${profile.minecraftId}/250`}
                alt={`${profile.minecraftId} Skin`}
                width={250}
                height={250}
                className="drop-shadow-[0_12px_24px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_12px_24px_rgba(255,255,255,0.08)] object-contain max-h-[300px]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://mc-heads.net/body/${profile.minecraftId}/220`;
                }}
              />
            </div>

            <a
              href={`https://mc-heads.net/download/${profile.minecraftId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 mt-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border-base bg-background/80 backdrop-blur-sm hover:bg-card-hover hover:text-foreground text-text-muted font-medium text-xs transition-all duration-200 cursor-pointer active:scale-95 shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              <span>下载皮肤</span>
            </a>
          </div>

          {/* Right Pane - Info details */}
          <div className="md:col-span-2 space-y-6">
            {/* Player Main Info */}
            <div className="space-y-2 select-none">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{profile.minecraftId}</h1>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-semibold
                  ${profile.role === "ADMIN" 
                    ? "bg-danger-bg/40 border-danger-border/40 text-danger" 
                    : "bg-success-bg/40 border-success-border/40 text-success-text"
                  }`}
                >
                  <Shield className="h-3 w-3" />
                  {profile.role === "ADMIN" ? "管理员" : "冒险家"}
                </span>
                
                <div className="flex items-center gap-1 text-text-muted">
                  <Calendar className="h-3.5 w-3.5 text-text-light" />
                  <span>注册时间: {formatDate(profile.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-3 gap-4 select-none">
              <div className="p-4 rounded-2xl bg-card-bg border border-border-base hover:bg-card-hover transition-colors duration-200">
                <div className="text-base font-bold text-foreground">{profile._count.discussions}</div>
                <div className="text-[10px] text-text-muted mt-0.5 font-semibold">发起讨论</div>
              </div>
              <div className="p-4 rounded-2xl bg-card-bg border border-border-base hover:bg-card-hover transition-colors duration-200">
                <div className="text-base font-bold text-foreground">{profile._count.replies}</div>
                <div className="text-[10px] text-text-muted mt-0.5 font-semibold">发表回复</div>
              </div>
              <div className="p-4 rounded-2xl bg-card-bg border border-border-base hover:bg-card-hover transition-colors duration-200">
                <div className="text-base font-bold text-foreground">{profile._count.votes}</div>
                <div className="text-[10px] text-text-muted mt-0.5 font-semibold">参与投票</div>
              </div>
            </div>

            {/* Player Discussions Activity Log */}
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-foreground border-b border-border-base/50 pb-2 mb-1 flex items-center gap-2 select-none">
                <MessageSquare className="h-4 w-4" />
                <span>发起的讨论话题 ({profile.discussions.length})</span>
              </h2>
              
              {profile.discussions.length === 0 ? (
                <div className="text-center py-12 border border-border-base border-dashed rounded-2xl bg-card-bg/25 text-xs text-text-muted select-none">
                  该冒险家非常低调，还没有发起过任何讨论话题。
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {profile.discussions.map((d) => (
                    <Link
                      key={d.id}
                      href={`/discussions/${d.id}`}
                      className="flex items-center justify-between p-4 rounded-xl border border-border-base bg-card-bg hover:border-border-muted hover:bg-card-hover transition-all duration-200 cursor-pointer group active:scale-[0.995]"
                    >
                      <span className="text-xs font-medium text-foreground group-hover:underline truncate max-w-[70%] tracking-tight">
                        {d.title}
                      </span>
                      <span className="text-[10px] text-text-light shrink-0 flex items-center gap-3 font-medium">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>{d._count.replies}</span>
                        </span>
                        <span>{formatDate(d.createdAt)}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
