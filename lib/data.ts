import { randomUUID } from "crypto";
import { and, asc, count, desc, eq, like, sql } from "drizzle-orm";
import { db, discussions, facilities, pollOptions, polls, pollVotes, replies, sqlite, users } from "./db";

function now() {
  return new Date().toISOString();
}

function id() {
  return randomUUID();
}

export async function findUserByMinecraftIdCaseInsensitive(minecraftId: string) {
  const candidates = await db
    .select()
    .from(users)
    .where(like(users.minecraftId, `${minecraftId.slice(0, 1)}%`));

  return candidates.find((user) => user.minecraftId.toLowerCase() === minecraftId.toLowerCase()) ?? null;
}

export async function findUserById(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return user ?? null;
}

export async function createUser(input: { minecraftId: string; passwordHash: string; role?: string }) {
  const [user] = await db
    .insert(users)
    .values({
      id: id(),
      minecraftId: input.minecraftId,
      passwordHash: input.passwordHash,
      role: input.role ?? "USER",
      createdAt: now(),
      updatedAt: now(),
    })
    .returning();

  return user;
}

export async function listUsersForAdmin() {
  const rows = await db
    .select({
      id: users.id,
      minecraftId: users.minecraftId,
      role: users.role,
      createdAt: users.createdAt,
      discussions: sql<number>`(select count(*) from "Discussion" where "authorId" = ${users.id})`,
      replies: sql<number>`(select count(*) from "Reply" where "authorId" = ${users.id})`,
    })
    .from(users)
    .orderBy(asc(users.minecraftId));

  return rows.map((user) => ({
    id: user.id,
    minecraftId: user.minecraftId,
    role: user.role,
    createdAt: user.createdAt,
    _count: {
      discussions: user.discussions,
      replies: user.replies,
    },
  }));
}

export async function setUserRole(input: { minecraftId: string; role: "USER" | "OP" }) {
  const user = await findUserByMinecraftIdCaseInsensitive(input.minecraftId);

  if (!user) {
    return null;
  }

  const [updatedUser] = await db
    .update(users)
    .set({
      role: input.role,
      updatedAt: now(),
    })
    .where(eq(users.id, user.id))
    .returning({
      id: users.id,
      minecraftId: users.minecraftId,
      role: users.role,
      createdAt: users.createdAt,
    });

  return updatedUser ?? null;
}

export async function listDiscussions() {
  const rows = await db
    .select({
      id: discussions.id,
      title: discussions.title,
      createdAt: discussions.createdAt,
      updatedAt: discussions.updatedAt,
      authorMinecraftId: users.minecraftId,
      replyCount: count(replies.id),
    })
    .from(discussions)
    .innerJoin(users, eq(discussions.authorId, users.id))
    .leftJoin(replies, eq(replies.discussionId, discussions.id))
    .groupBy(discussions.id)
    .orderBy(desc(discussions.updatedAt));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    author: { minecraftId: row.authorMinecraftId },
    _count: { replies: row.replyCount },
  }));
}

export async function createDiscussion(input: {
  title: string;
  content: string;
  authorId: string;
  poll?: {
    question: string;
    options: string[];
  };
}) {
  const discussionId = id();
  const createdAt = now();

  sqlite.transaction(() => {
    sqlite
      .prepare(
        'INSERT INTO "Discussion" ("id", "title", "content", "createdAt", "updatedAt", "authorId") VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(discussionId, input.title, input.content, createdAt, createdAt, input.authorId);

    if (input.poll) {
      const pollId = id();
      sqlite
        .prepare('INSERT INTO "Poll" ("id", "question", "discussionId") VALUES (?, ?, ?)')
        .run(pollId, input.poll.question, discussionId);

      const insertOption = sqlite.prepare('INSERT INTO "PollOption" ("id", "text", "pollId") VALUES (?, ?, ?)');
      for (const option of input.poll.options) {
        insertOption.run(id(), option, pollId);
      }
    }
  })();

  return { id: discussionId };
}

export async function getDiscussionDetail(discussionId: string) {
  const [discussion] = await db
    .select({
      id: discussions.id,
      title: discussions.title,
      content: discussions.content,
      createdAt: discussions.createdAt,
      updatedAt: discussions.updatedAt,
      authorMinecraftId: users.minecraftId,
    })
    .from(discussions)
    .innerJoin(users, eq(discussions.authorId, users.id))
    .where(eq(discussions.id, discussionId));

  if (!discussion) {
    return null;
  }

  const discussionReplies = await db
    .select({
      id: replies.id,
      content: replies.content,
      createdAt: replies.createdAt,
      authorMinecraftId: users.minecraftId,
    })
    .from(replies)
    .innerJoin(users, eq(replies.authorId, users.id))
    .where(eq(replies.discussionId, discussionId))
    .orderBy(asc(replies.createdAt));

  const [poll] = await db.select().from(polls).where(eq(polls.discussionId, discussionId));

  let pollPayload:
    | {
        id: string;
        question: string;
        options: { id: string; text: string; _count: { votes: number } }[];
        votes: { userId: string; optionId: string }[];
      }
    | undefined;

  if (poll) {
    const options = await db
      .select({
        id: pollOptions.id,
        text: pollOptions.text,
        votes: count(pollVotes.id),
      })
      .from(pollOptions)
      .leftJoin(pollVotes, eq(pollVotes.optionId, pollOptions.id))
      .where(eq(pollOptions.pollId, poll.id))
      .groupBy(pollOptions.id);

    const votes = await db
      .select({
        userId: pollVotes.userId,
        optionId: pollVotes.optionId,
      })
      .from(pollVotes)
      .where(eq(pollVotes.pollId, poll.id));

    pollPayload = {
      id: poll.id,
      question: poll.question,
      options: options.map((option) => ({
        id: option.id,
        text: option.text,
        _count: { votes: option.votes },
      })),
      votes,
    };
  }

  return {
    id: discussion.id,
    title: discussion.title,
    content: discussion.content,
    createdAt: discussion.createdAt,
    updatedAt: discussion.updatedAt,
    author: { minecraftId: discussion.authorMinecraftId },
    replies: discussionReplies.map((reply) => ({
      id: reply.id,
      content: reply.content,
      createdAt: reply.createdAt,
      author: { minecraftId: reply.authorMinecraftId },
    })),
    poll: pollPayload,
  };
}

export async function discussionExists(discussionId: string) {
  const [discussion] = await db
    .select({ id: discussions.id })
    .from(discussions)
    .where(eq(discussions.id, discussionId));

  return Boolean(discussion);
}

export async function deleteDiscussion(discussionId: string) {
  const result = await db
    .delete(discussions)
    .where(eq(discussions.id, discussionId))
    .returning({ id: discussions.id });

  return result.length > 0;
}

export async function createReply(input: { content: string; discussionId: string; authorId: string }) {
  const replyId = id();
  const createdAt = now();

  sqlite.transaction(() => {
    sqlite
      .prepare(
        'INSERT INTO "Reply" ("id", "content", "createdAt", "discussionId", "authorId") VALUES (?, ?, ?, ?, ?)',
      )
      .run(replyId, input.content, createdAt, input.discussionId, input.authorId);

    sqlite.prepare('UPDATE "Discussion" SET "updatedAt" = ? WHERE "id" = ?').run(createdAt, input.discussionId);
  })();

  const [reply] = await db
    .select({
      id: replies.id,
      content: replies.content,
      createdAt: replies.createdAt,
      authorMinecraftId: users.minecraftId,
    })
    .from(replies)
    .innerJoin(users, eq(replies.authorId, users.id))
    .where(eq(replies.id, replyId));

  return {
    id: reply.id,
    content: reply.content,
    createdAt: reply.createdAt,
    author: { minecraftId: reply.authorMinecraftId },
  };
}

export async function deleteReply(replyId: string) {
  const result = await db
    .delete(replies)
    .where(eq(replies.id, replyId))
    .returning({ id: replies.id });

  return result.length > 0;
}

export async function getPollForDiscussion(discussionId: string) {
  const [poll] = await db.select().from(polls).where(eq(polls.discussionId, discussionId));
  return poll ?? null;
}

export async function getPollOption(optionId: string, pollId: string) {
  const [option] = await db
    .select()
    .from(pollOptions)
    .where(and(eq(pollOptions.id, optionId), eq(pollOptions.pollId, pollId)));

  return option ?? null;
}

export async function createPollVote(input: { userId: string; pollId: string; optionId: string }) {
  const [vote] = await db
    .insert(pollVotes)
    .values({
      id: id(),
      userId: input.userId,
      pollId: input.pollId,
      optionId: input.optionId,
    })
    .returning();

  return vote;
}

export async function getUserProfile(minecraftId: string) {
  const [user] = await db
    .select({
      id: users.id,
      minecraftId: users.minecraftId,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.minecraftId, minecraftId));

  if (!user) {
    return null;
  }

  const userDiscussions = await db
    .select({
      id: discussions.id,
      title: discussions.title,
      createdAt: discussions.createdAt,
      replies: count(replies.id),
    })
    .from(discussions)
    .leftJoin(replies, eq(replies.discussionId, discussions.id))
    .where(eq(discussions.authorId, user.id))
    .groupBy(discussions.id)
    .orderBy(desc(discussions.createdAt));

  const [counts] = await db
    .select({
      discussions: sql<number>`(select count(*) from "Discussion" where "authorId" = ${user.id})`,
      replies: sql<number>`(select count(*) from "Reply" where "authorId" = ${user.id})`,
      votes: sql<number>`(select count(*) from "PollVote" where "userId" = ${user.id})`,
    })
    .from(users)
    .where(eq(users.id, user.id));

  return {
    ...user,
    discussions: userDiscussions.map((discussion) => ({
      id: discussion.id,
      title: discussion.title,
      createdAt: discussion.createdAt,
      _count: { replies: discussion.replies },
    })),
    _count: counts,
  };
}

// ===== 公共设施清单 =====

export async function listFacilities() {
  const rows = await db
    .select({
      id: facilities.id,
      landName: facilities.landName,
      facilityName: facilities.facilityName,
      builder: facilities.builder,
      authorId: facilities.authorId,
      createdAt: facilities.createdAt,
    })
    .from(facilities)
    .orderBy(desc(facilities.createdAt));

  return rows.map((row) => ({
    id: row.id,
    landName: row.landName,
    facilityName: row.facilityName,
    builder: row.builder,
    authorId: row.authorId,
    createdAt: row.createdAt,
    teleportCommand: `/res tp ${row.landName}`,
  }));
}

export async function createFacility(input: {
  landName: string;
  facilityName: string;
  builder: string;
  authorId: string;
}) {
  const [facility] = await db
    .insert(facilities)
    .values({
      id: id(),
      landName: input.landName,
      facilityName: input.facilityName,
      builder: input.builder,
      authorId: input.authorId,
      createdAt: now(),
      updatedAt: now(),
    })
    .returning();

  return facility;
}

// 仅返回属于该 authorId 的设施，用于编辑页鉴权与预填
export async function getFacilityForOwner(facilityId: string, authorId: string) {
  const [facility] = await db
    .select({
      id: facilities.id,
      landName: facilities.landName,
      facilityName: facilities.facilityName,
      builder: facilities.builder,
      authorId: facilities.authorId,
    })
    .from(facilities)
    .where(and(eq(facilities.id, facilityId), eq(facilities.authorId, authorId)));

  return facility ?? null;
}

export async function getFacilityForManager(facilityId: string, userId: string, canManageAll: boolean) {
  const [facility] = await db
    .select({
      id: facilities.id,
      landName: facilities.landName,
      facilityName: facilities.facilityName,
      builder: facilities.builder,
      authorId: facilities.authorId,
    })
    .from(facilities)
    .where(canManageAll ? eq(facilities.id, facilityId) : and(eq(facilities.id, facilityId), eq(facilities.authorId, userId)));

  return facility ?? null;
}

export async function updateFacility(input: {
  id: string;
  authorId: string;
  canManageAll?: boolean;
  landName: string;
  facilityName: string;
  builder: string;
}) {
  const result = await db
    .update(facilities)
    .set({
      landName: input.landName,
      facilityName: input.facilityName,
      builder: input.builder,
      updatedAt: now(),
    })
    .where(input.canManageAll ? eq(facilities.id, input.id) : and(eq(facilities.id, input.id), eq(facilities.authorId, input.authorId)))
    .returning();

  return result.length > 0;
}

export async function deleteFacility(input: { id: string; authorId: string; canManageAll?: boolean }) {
  const result = await db
    .delete(facilities)
    .where(input.canManageAll ? eq(facilities.id, input.id) : and(eq(facilities.id, input.id), eq(facilities.authorId, input.authorId)))
    .returning();

  return result.length > 0;
}
