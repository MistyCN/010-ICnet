import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteFacility, updateFacility } from "@/lib/data";
import { validateBuilder, validateFacilityName, validateLandName } from "@/lib/validators";
import { isOpRole } from "@/lib/admin";

// 编辑自己登记的设施（按 authorId 校验归属）
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "请登录后操作" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { landName, facilityName, builder } = body;

    const landNameVal = validateLandName(landName);
    if (!landNameVal.isValid) {
      return NextResponse.json({ error: landNameVal.error }, { status: 400 });
    }

    const facilityNameVal = validateFacilityName(facilityName);
    if (!facilityNameVal.isValid) {
      return NextResponse.json({ error: facilityNameVal.error }, { status: 400 });
    }

    const builderVal = validateBuilder(builder);
    if (!builderVal.isValid) {
      return NextResponse.json({ error: builderVal.error }, { status: 400 });
    }

    const updated = await updateFacility({
      id,
      authorId: session.user.id,
      canManageAll: isOpRole(session.user.role),
      landName: landName.trim(),
      facilityName: facilityName.trim(),
      builder: builder.trim(),
    });

    if (!updated) {
      return NextResponse.json({ error: "设施不存在或无权编辑" }, { status: 404 });
    }

    return NextResponse.json({ id, message: "更新成功" });
  } catch (error) {
    console.error("Update facility error:", error);
    return NextResponse.json({ error: "更新公共设施失败，请稍后重试" }, { status: 500 });
  }
}

// 删除自己登记的设施（按 authorId 校验归属）
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "请登录后操作" }, { status: 401 });
    }

    const { id } = await params;

    const deleted = await deleteFacility({
      id,
      authorId: session.user.id,
      canManageAll: isOpRole(session.user.role),
    });

    if (!deleted) {
      return NextResponse.json({ error: "设施不存在或无权删除" }, { status: 404 });
    }

    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    console.error("Delete facility error:", error);
    return NextResponse.json({ error: "删除公共设施失败，请稍后重试" }, { status: 500 });
  }
}
