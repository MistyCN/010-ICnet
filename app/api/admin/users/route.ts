import { NextResponse } from "next/server";
import { getCurrentOpSession, verifyGlobalAdminPassword } from "@/lib/admin";
import { listUsersForAdmin, setUserRole } from "@/lib/data";
import { validateMinecraftId } from "@/lib/validators";

export const dynamic = "force-dynamic";

async function canUseAdminApi(password: unknown) {
  const opSession = await getCurrentOpSession();
  if (opSession) {
    return { ok: true, error: undefined };
  }

  return verifyGlobalAdminPassword(password);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const auth = await canUseAdminApi(body.adminPassword);

    if (!auth.ok) {
      return NextResponse.json({ error: auth.error || "无权访问后台" }, { status: 403 });
    }

    const users = await listUsersForAdmin();
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Admin list users error:", error);
    return NextResponse.json({ error: "获取用户列表失败" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const auth = await canUseAdminApi(body.adminPassword);

    if (!auth.ok) {
      return NextResponse.json({ error: auth.error || "无权访问后台" }, { status: 403 });
    }

    const minecraftId = typeof body.minecraftId === "string" ? body.minecraftId.trim() : "";
    const role = body.role === "OP" ? "OP" : body.role === "USER" ? "USER" : null;

    const idVal = validateMinecraftId(minecraftId);
    if (!idVal.isValid) {
      return NextResponse.json({ error: idVal.error || "无效的游戏 ID" }, { status: 400 });
    }

    if (!role) {
      return NextResponse.json({ error: "无效的权限类型" }, { status: 400 });
    }

    const updatedUser = await setUserRole({ minecraftId, role });

    if (!updatedUser) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    return NextResponse.json({
      user: updatedUser,
      message: role === "OP" ? "已设置为 OP" : "已取消 OP",
    });
  } catch (error) {
    console.error("Admin update user role error:", error);
    return NextResponse.json({ error: "更新用户权限失败" }, { status: 500 });
  }
}
