"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, User, Loader2, AlertCircle, ShieldAlert } from "lucide-react";
import { validateMinecraftId, validatePassword } from "@/lib/validators";

export default function LoginForm() {
  const router = useRouter();
  const [minecraftId, setMinecraftId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mcIdError, setMcIdError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleMinecraftIdChange = (val: string) => {
    setMinecraftId(val);
    if (val) {
      const check = validateMinecraftId(val);
      setMcIdError(check.isValid ? null : check.error || "无效的游戏 ID");
    } else {
      setMcIdError(null);
    }
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (val) {
      const check = validatePassword(val);
      setPasswordError(check.isValid ? null : check.error || "无效的密码");
    } else {
      setPasswordError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError(null);

    const idCheck = validateMinecraftId(minecraftId);
    const pwCheck = validatePassword(password);

    if (!idCheck.isValid) {
      setMcIdError(idCheck.error || "无效的游戏 ID");
      return;
    }
    if (!pwCheck.isValid) {
      setPasswordError(pwCheck.error || "无效的密码");
      return;
    }

    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        minecraftId: minecraftId.trim(),
        password,
      });

      if (res?.error) {
        setError("Minecraft ID 或密码错误");
      } else {
        router.push("/discussions");
        router.refresh();
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("登录发生错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 rounded-2xl bg-card-bg border border-border-base shadow-sm animate-fade-in">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">登录到 InfCraft</h1>
        <p className="text-xs text-text-muted mt-1.5 font-normal">使用您的 Minecraft 游戏 ID 进行登录</p>
      </div>

      <div className="mb-4 p-3 rounded-xl border border-warning-border bg-warning-bg/10 text-warning-text text-[11px] leading-relaxed text-left select-none">
        <div className="font-semibold mb-1 flex items-center gap-1">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
          <span>安全提示</span>
        </div>
        本站为独立注册。**网站密码**、**服务器内登录密码**与您的**微软 Minecraft 账号密码**是完全不同的东西。请勿在此处输入您的微软账号密码，也建议不要使用相同密码！
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-xs bg-danger-bg border border-danger-border text-danger px-3 py-2.5 rounded-lg select-none">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground block">Minecraft 游戏 ID</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-light" />
            <input
              type="text"
              value={minecraftId}
              onChange={(e) => handleMinecraftIdChange(e.target.value)}
              disabled={loading}
              placeholder="Minecraft ID"
              className={`w-full text-sm pl-9 pr-4 py-2.5 rounded-xl border bg-background text-foreground placeholder-text-light transition-all focus:outline-none focus:ring-1
                ${mcIdError 
                  ? "border-danger focus:ring-danger focus:border-danger" 
                  : "border-border-base focus:ring-foreground focus:border-foreground"
                }`}
            />
          </div>
          {mcIdError && <p className="text-[10px] text-danger mt-1">{mcIdError}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground block">密码</label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-light" />
            <input
              type="password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              disabled={loading}
              placeholder="您的密码"
              className={`w-full text-sm pl-9 pr-4 py-2.5 rounded-xl border bg-background text-foreground placeholder-text-light transition-all focus:outline-none focus:ring-1
                ${passwordError 
                  ? "border-danger focus:ring-danger focus:border-danger" 
                  : "border-border-base focus:ring-foreground focus:border-foreground"
                }`}
            />
          </div>
          {passwordError && <p className="text-[10px] text-danger mt-1">{passwordError}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer active:scale-98 mt-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span>登录</span>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-text-muted">
        还没有账号？{" "}
        <Link href="/register" className="text-foreground hover:underline font-medium">
          立即注册
        </Link>
      </div>
    </div>
  );
}
