import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createReply, discussionExists } from "@/lib/data";
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
