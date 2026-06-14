import { NextResponse } from "next/server";
import { getUserProfile } from "@/lib/data";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    const user = await getUserProfile(username);

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Fetch profile error:", error);
    return NextResponse.json({ error: "获取用户信息失败" }, { status: 500 });
  }
}
