import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createDiscussion, listDiscussions } from "@/lib/data";
import { validateDiscussionTitle, validateDiscussionContent } from "@/lib/validators";

export async function GET() {
  try {
    const discussions = await listDiscussions();

    return NextResponse.json(discussions);
  } catch (error) {
    console.error("Fetch discussions error:", error);
    return NextResponse.json({ error: "获取讨论列表失败" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "请登录后操作" }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, poll } = body;

    // Validate inputs
    const titleVal = validateDiscussionTitle(title);
    if (!titleVal.isValid) {
      return NextResponse.json({ error: titleVal.error }, { status: 400 });
    }

    const contentVal = validateDiscussionContent(content);
    if (!contentVal.isValid) {
      return NextResponse.json({ error: contentVal.error }, { status: 400 });
    }

    // Validate optional poll inputs
    if (poll) {
      if (!poll.question || poll.question.trim().length < 3) {
        return NextResponse.json({ error: "投票问题不能为空且至少包含 3 个字符" }, { status: 400 });
      }
      if (!Array.isArray(poll.options) || poll.options.filter((o: string) => o.trim()).length < 2) {
        return NextResponse.json({ error: "投票必须包含至少 2 个有效选项" }, { status: 400 });
      }
      if (poll.options.length > 6) {
        return NextResponse.json({ error: "投票最多包含 6 个选项" }, { status: 400 });
      }
    }

    const newDiscussion = await createDiscussion({
      title: title.trim(),
      content: (content || "").trim(),
      authorId: session.user.id,
      poll: poll
        ? {
            question: poll.question.trim(),
            options: poll.options.map((o: string) => o.trim()).filter(Boolean),
          }
        : undefined,
    });

    return NextResponse.json({ id: newDiscussion.id, message: "发布成功" }, { status: 201 });
  } catch (error) {
    console.error("Create discussion error:", error);
    return NextResponse.json({ error: "发布讨论失败，请稍后重试" }, { status: 500 });
  }
}
