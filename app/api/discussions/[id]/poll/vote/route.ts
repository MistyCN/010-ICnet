import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createPollVote, getPollForDiscussion, getPollOption } from "@/lib/data";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: discussionId } = await params;

    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Please sign in before voting" }, { status: 401 });
    }

    const body = await req.json();
    const { optionId } = body;

    if (!optionId) {
      return NextResponse.json({ error: "Please choose an option" }, { status: 400 });
    }

    const poll = await getPollForDiscussion(discussionId);
    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    const option = await getPollOption(optionId, poll.id);
    if (!option) {
      return NextResponse.json({ error: "Invalid poll option" }, { status: 400 });
    }

    try {
      const vote = await createPollVote({
        userId: session.user.id,
        pollId: poll.id,
        optionId,
      });

      return NextResponse.json({ message: "Vote submitted", vote }, { status: 201 });
    } catch (error: any) {
      if (error?.code === "SQLITE_CONSTRAINT_UNIQUE") {
        return NextResponse.json({ error: "You have already voted in this poll" }, { status: 400 });
      }

      throw error;
    }
  } catch (error) {
    console.error("Cast vote error:", error);
    return NextResponse.json({ error: "Failed to submit vote" }, { status: 500 });
  }
}
