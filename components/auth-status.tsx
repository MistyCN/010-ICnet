"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { LogOut, User, LogIn } from "lucide-react";
import { useState } from "react";

export default function AuthStatus() {
  const { data: session, status } = useSession();
  const [avatarError, setAvatarError] = useState(false);

  if (status === "loading") {
    return (
      <div className="h-6 w-20 animate-pulse rounded bg-card-hover" />
    );
  }

  if (session && session.user) {
    const minecraftId = session.user.minecraftId;
    return (
      <div className="flex items-center gap-3">
        <Link
          href={`/profile/${minecraftId}`}
          className="flex items-center gap-2 px-2 py-1 rounded-md bg-card border border-border-base hover:bg-card-hover hover:border-border-muted transition-all duration-200 cursor-pointer select-none group"
        >
          {!avatarError ? (
            <img
              src={`https://mc-heads.net/avatar/${minecraftId}/20`}
              alt={minecraftId}
              width={20}
              height={20}
              className="rounded-sm object-contain group-hover:scale-105 transition-transform duration-200"
              onError={() => setAvatarError(true)}
            />
          ) : (
            <User className="h-4 w-4 text-text-muted" />
          )}
          <span className="text-xs font-medium text-foreground group-hover:text-foreground">{minecraftId}</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="p-1 rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-all cursor-pointer"
          title="退出登录"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="text-xs text-text-muted hover:text-foreground px-2.5 py-1.5 rounded-md hover:bg-card-hover transition-colors font-medium flex items-center gap-1"
      >
        <LogIn className="h-3.5 w-3.5" />
        登录
      </Link>
      <Link
        href="/register"
        className="text-xs bg-foreground text-background hover:bg-foreground/90 px-2.5 py-1.5 rounded-md transition-colors font-medium"
      >
        注册
      </Link>
    </div>
  );
}
