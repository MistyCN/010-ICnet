import { NextResponse } from "next/server";
import { getDiscussionDetail } from "@/lib/data";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
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
