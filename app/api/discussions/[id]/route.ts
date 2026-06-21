import { NextResponse } from "next/server";
import { getCurrentOpSession } from "@/lib/admin";
import { deleteDiscussion, getDiscussionDetail } from "@/lib/data";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const discussion = await getDiscussionDetail(id);

    if (!discussion) {
      return NextResponse.json({ error: "讨论不存在" }, { status: 404 });
    }

    return NextResponse.json(discussion);
  } catch (error) {
    console.error("Fetch discussion detail error:", error);
    return NextResponse.json({ error: "获取讨论详情失败" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getCurrentOpSession();
    if (!session) {
      return NextResponse.json({ error: "需要 OP 权限" }, { status: 403 });
    }

    const { id } = await params;
    const deleted = await deleteDiscussion(id);

    if (!deleted) {
      return NextResponse.json({ error: "讨论不存在" }, { status: 404 });
    }

    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    console.error("Delete discussion error:", error);
    return NextResponse.json({ error: "删除讨论失败" }, { status: 500 });
  }
}
