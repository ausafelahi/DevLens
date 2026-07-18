import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  jsonb,
  vector,
} from "drizzle-orm/pg-core";

// One row per imported repository
export const repositories = pgTable("repositories", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(), // Clerk user id
  githubUrl: text("github_url").notNull(),
  name: text("name").notNull(),
  defaultBranch: text("default_branch").default("main"),
  status: text("status").notNull().default("pending"), // pending | indexing | ready | failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// One row per chunk of an indexed file — this is what gets embedded and searched
export const chunks = pgTable("chunks", {
  id: uuid("id").defaultRandom().primaryKey(),
  repositoryId: uuid("repository_id")
    .references(() => repositories.id, { onDelete: "cascade" })
    .notNull(),
  filePath: text("file_path").notNull(),
  content: text("content").notNull(),
  // 768 dims matches gemini-embedding-001 truncated output (recommended tradeoff:
  // ~0.26% quality loss vs default 3072, quarter the storage). Change if model changes.
  embedding: vector("embedding", { dimensions: 768 }),
  metadata: jsonb("metadata").$type<{
    functionName?: string;
    startLine?: number;
    endLine?: number;
    language?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chat history per repo (student-facing "explain like I'm new here" conversations)
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  repositoryId: uuid("repository_id")
    .references(() => repositories.id, { onDelete: "cascade" })
    .notNull(),
  userId: text("user_id").notNull(),
  role: text("role").notNull(), // user | assistant
  content: text("content").notNull(),
  relatedFiles: jsonb("related_files").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
