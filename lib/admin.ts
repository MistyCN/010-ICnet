import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { findUserById } from "@/lib/data";

export const OP_ROLE = "OP";

export function isOpRole(role?: string | null) {
  return role === OP_ROLE;
}

export function verifyGlobalAdminPassword(password: unknown) {
  const configuredPassword = process.env.GLOBAL_ADMIN_PASSWORD;

  if (!configuredPassword) {
    return { ok: false, error: "尚未配置全局管理员密码" };
  }

  if (typeof password !== "string" || password.length === 0) {
    return { ok: false, error: "请输入全局管理员密码" };
  }

  return {
    ok: password === configuredPassword,
    error: password === configuredPassword ? undefined : "全局管理员密码错误",
  };
}

export async function getCurrentRole() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { session: null, role: null };
  }

  const user = await findUserById(session.user.id);

  return {
    session,
    role: user?.role ?? session.user.role ?? null,
  };
}

export async function getCurrentOpSession() {
  const { session, role } = await getCurrentRole();

  if (!session?.user?.id || !isOpRole(role)) {
    return null;
  }

  return session;
}
