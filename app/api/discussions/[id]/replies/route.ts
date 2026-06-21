import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentOpSession } from "@/lib/admin";
import { createReply, deleteReply, discussionExists } from "@/lib/data";
import { validateReplyContent } from "@/lib/validators";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: discussionId } = await params;

    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Please sign in first" }, { status: 401 });
    }

    const body = await req.json();
    const { content } = body;

    const contentVal = validateReplyContent(content);
    if (!contentVal.isValid) {
      return NextResponse.json({ error: contentVal.error }, { status: 400 });
    }

    if (!(await discussionExists(discussionId))) {
      return NextResponse.json({ error: "Discussion not found" }, { status: 404 });
    }

    const reply = await createReply({
      content: content.trim(),
      discussionId,
      authorId: session.user.id,
    });

    return NextResponse.json(reply, { status: 201 });
  } catch (error) {
    console.error("Create reply error:", error);
    return NextResponse.json({ error: "Failed to create reply" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getCurrentOpSession();
    if (!session) {
      return NextResponse.json({ error: "需要 OP 权限" }, { status: 403 });
    }

    const body = await req.json();
    const replyId = typeof body.replyId === "string" ? body.replyId : "";

    if (!replyId) {
      return NextResponse.json({ error: "缺少回复 ID" }, { status: 400 });
    }

    const deleted = await deleteReply(replyId);

    if (!deleted) {
      return NextResponse.json({ error: "回复不存在" }, { status: 404 });
    }

    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    console.error("Delete reply error:", error);
    return NextResponse.json({ error: "删除回复失败" }, { status: 500 });
  }
}
