import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  jsonb,
  vector,
} from "drizzle-orm/pg-core";

export const repositories = pgTable("repositories", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  githubUrl: text("github_url").notNull(),
  name: text("name").notNull(),
  defaultBranch: text("default_branch").default("main"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chunks = pgTable("chunks", {
  id: uuid("id").defaultRandom().primaryKey(),
  repositoryId: uuid("repository_id")
    .references(() => repositories.id, { onDelete: "cascade" })
    .notNull(),
  filePath: text("file_path").notNull(),
  content: text("content").notNull(),
  embedding: vector("embedding", { dimensions: 768 }),
  metadata: jsonb("metadata").$type<{
    functionName?: string;
    startLine?: number;
    endLine?: number;
    language?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  repositoryId: uuid("repository_id")
    .references(() => repositories.id, { onDelete: "cascade" })
    .notNull(),
  userId: text("user_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  relatedFiles: jsonb("related_files").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const architectureReports = pgTable("architecture_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  repositoryId: uuid("repository_id")
    .references(() => repositories.id, { onDelete: "cascade" })
    .notNull(),
  summary: text("summary").notNull(),
  fileTree: jsonb("file_tree").$type<string[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
