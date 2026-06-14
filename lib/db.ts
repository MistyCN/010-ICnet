import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const databaseUrl = process.env.DATABASE_URL || "file:./dev.db";

function sqlitePathFromUrl(url: string) {
  if (url.startsWith("file:")) {
    return url.slice("file:".length);
  }

  return url;
}

const sqliteClientSingleton = () => {
  const client = new Database(sqlitePathFromUrl(databaseUrl));
  client.pragma("foreign_keys = ON");
  return client;
};

const globalForDb = globalThis as unknown as {
  sqliteGlobal: ReturnType<typeof sqliteClientSingleton> | undefined;
};

export const sqlite = globalForDb.sqliteGlobal ?? sqliteClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalForDb.sqliteGlobal = sqlite;
}

export const users = sqliteTable(
  "User",
  {
    id: text("id").primaryKey(),
    minecraftId: text("minecraftId").notNull(),
    passwordHash: text("passwordHash").notNull(),
    role: text("role").notNull().default("USER"),
    createdAt: text("createdAt").notNull().default("CURRENT_TIMESTAMP"),
    updatedAt: text("updatedAt").notNull(),
  },
  (table) => [uniqueIndex("User_minecraftId_key").on(table.minecraftId)],
);

export const discussions = sqliteTable("Discussion", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: text("createdAt").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updatedAt").notNull(),
  authorId: text("authorId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
});

export const replies = sqliteTable("Reply", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  createdAt: text("createdAt").notNull().default("CURRENT_TIMESTAMP"),
  discussionId: text("discussionId")
    .notNull()
    .references(() => discussions.id, { onDelete: "cascade", onUpdate: "cascade" }),
  authorId: text("authorId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
});

export const polls = sqliteTable(
  "Poll",
  {
    id: text("id").primaryKey(),
    question: text("question").notNull(),
    discussionId: text("discussionId")
      .notNull()
      .references(() => discussions.id, { onDelete: "cascade", onUpdate: "cascade" }),
  },
  (table) => [uniqueIndex("Poll_discussionId_key").on(table.discussionId)],
);

export const pollOptions = sqliteTable("PollOption", {
  id: text("id").primaryKey(),
  text: text("text").notNull(),
  pollId: text("pollId")
    .notNull()
    .references(() => polls.id, { onDelete: "cascade", onUpdate: "cascade" }),
});

export const pollVotes = sqliteTable(
  "PollVote",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    pollId: text("pollId")
      .notNull()
      .references(() => polls.id, { onDelete: "cascade", onUpdate: "cascade" }),
    optionId: text("optionId")
      .notNull()
      .references(() => pollOptions.id, { onDelete: "cascade", onUpdate: "cascade" }),
  },
  (table) => [uniqueIndex("PollVote_userId_pollId_key").on(table.userId, table.pollId)],
);

export const db = drizzle(sqlite);
