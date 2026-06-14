import { NextResponse } from "next/server";
import { createUser, findUserByMinecraftIdCaseInsensitive } from "@/lib/data";
import { hashPassword } from "@/lib/passwords";
import { validateMinecraftId, validatePassword } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { minecraftId, password } = body;

    // Validate inputs
    const idVal = validateMinecraftId(minecraftId);
    if (!idVal.isValid) {
      return NextResponse.json({ error: idVal.error }, { status: 400 });
    }

    const pwVal = validatePassword(password);
    if (!pwVal.isValid) {
      return NextResponse.json({ error: pwVal.error }, { status: 400 });
    }

    const trimmedId = minecraftId.trim();

    const existingUser = await findUserByMinecraftIdCaseInsensitive(trimmedId);

    if (existingUser) {
      return NextResponse.json({ error: "该游戏 ID 已被注册" }, { status: 409 });
    }

    // Hash password and save
    const passwordHash = await hashPassword(password);
    const newUser = await createUser({
      minecraftId: trimmedId,
      passwordHash,
      role: "USER",
    });

    return NextResponse.json(
      {
        id: newUser.id,
        minecraftId: newUser.minecraftId,
        role: newUser.role,
        message: "注册成功",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "注册失败，请稍后重试" }, { status: 500 });
  }
}
