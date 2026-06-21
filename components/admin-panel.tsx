"use client";

import { FormEvent, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Search, Shield, ShieldCheck, UserCog } from "lucide-react";

interface AdminUser {
  id: string;
  minecraftId: string;
  role: string;
  createdAt: string;
  _count: {
    discussions: number;
    replies: number;
  };
}

export default function AdminPanel() {
  const { data: session } = useSession();
  const [adminPassword, setAdminPassword] = useState("");
  const [minecraftId, setMinecraftId] = useState("");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const isOp = session?.user?.role === "OP";
  const canSubmit = isOp || adminPassword.length > 0;

  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((user) => user.minecraftId.toLowerCase().includes(needle));
  }, [query, users]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "获取用户列表失败");
        return;
      }

      setUsers(data.users || []);
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoadingUsers(false);
    }
  };

  const updateRole = async (targetMinecraftId: string, role: "USER" | "OP") => {
    setUpdatingUserId(targetMinecraftId);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminPassword,
          minecraftId: targetMinecraftId,
          role,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "更新用户权限失败");
        return;
      }

      setMessage(data.message || "更新成功");
      setMinecraftId("");
      setUsers((current) =>
        current.map((user) =>
          user.minecraftId.toLowerCase() === targetMinecraftId.toLowerCase()
            ? { ...user, role: data.user.role }
            : user,
        ),
      );

      if (users.length === 0) {
        await fetchUsers();
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleSetOp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const target = minecraftId.trim();
    if (!target || updatingUserId) return;
    await updateRole(target, "OP");
  };

  return (
    <div className="flex-grow bg-background py-10 animate-fade-in">
      <div className="mx-auto max-w-5xl px-6 space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border-base bg-card-bg px-3 py-1 text-[10px] font-semibold text-text-muted">
            <Shield className="h-3.5 w-3.5" />
            <span>{isOp ? "OP 后台" : "全局管理员入口"}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">后台管理</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
            使用全局管理员密码指定注册用户为 OP。成为 OP 后，该用户可直接登录并管理全站内容，不需要再使用全局管理员密码。
          </p>
        </div>

        {message && (
          <div className="rounded-xl border border-success-border bg-success-bg px-4 py-3 text-sm text-success-text">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <section className="rounded-2xl border border-border-base bg-card-bg p-5 shadow-sm">
            <form onSubmit={handleSetOp} className="space-y-4">
              {!isOp && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-muted">
                    全局管理员密码
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(event) => setAdminPassword(event.target.value)}
                    className="w-full rounded-xl border border-border-base bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-foreground focus:ring-1 focus:ring-foreground"
                    autoComplete="current-password"
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">
                  指定注册用户为 OP
                </label>
                <input
                  type="text"
                  value={minecraftId}
                  onChange={(event) => setMinecraftId(event.target.value)}
                  placeholder="Minecraft ID"
                  className="w-full rounded-xl border border-border-base bg-background px-4 py-2.5 text-sm text-foreground outline-none transition placeholder:text-text-light focus:border-foreground focus:ring-1 focus:ring-foreground"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="submit"
                  disabled={!canSubmit || !minecraftId.trim() || Boolean(updatingUserId)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-foreground px-4 py-2.5 text-xs font-medium text-background shadow-sm transition hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updatingUserId === minecraftId.trim() ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-3.5 w-3.5" />
                  )}
                  <span>设为 OP</span>
                </button>
                <button
                  type="button"
                  onClick={fetchUsers}
                  disabled={!canSubmit || loadingUsers}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border-base bg-background px-4 py-2.5 text-xs font-medium text-foreground transition hover:bg-card-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingUsers ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <UserCog className="h-3.5 w-3.5" />
                  )}
                  <span>查看用户</span>
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-border-base bg-card-bg p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">注册用户</h2>
                <p className="mt-1 text-xs text-text-muted">可在这里取消误设的 OP。</p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-light" />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索用户"
                  className="w-full rounded-xl border border-border-base bg-background py-2 pl-9 pr-3 text-xs text-foreground outline-none transition placeholder:text-text-light focus:border-foreground focus:ring-1 focus:ring-foreground"
                />
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border-base bg-background/50 py-12 text-center text-xs text-text-muted">
                {users.length === 0 ? "输入密码后查看用户列表" : "没有匹配的用户"}
              </div>
            ) : (
              <div className="divide-y divide-border-base overflow-hidden rounded-xl border border-border-base bg-background">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-semibold text-foreground">{user.minecraftId}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                          user.role === "OP"
                            ? "border-danger-border bg-danger-bg text-danger"
                            : "border-success-border bg-success-bg text-success-text"
                        }`}>
                          {user.role === "OP" ? "OP" : "USER"}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-text-light">
                        讨论 {user._count.discussions} · 回复 {user._count.replies}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {user.role === "OP" ? (
                        <button
                          type="button"
                          onClick={() => updateRole(user.minecraftId, "USER")}
                          disabled={Boolean(updatingUserId)}
                          className="rounded-xl border border-border-base bg-card-bg px-3 py-2 text-xs font-medium text-text-muted transition hover:border-danger-border hover:text-danger disabled:opacity-50"
                        >
                          取消 OP
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateRole(user.minecraftId, "OP")}
                          disabled={Boolean(updatingUserId)}
                          className="rounded-xl border border-border-base bg-card-bg px-3 py-2 text-xs font-medium text-foreground transition hover:bg-card-hover disabled:opacity-50"
                        >
                          设为 OP
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
