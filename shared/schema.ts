import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  techStack: text("tech_stack").array(),
  status: text("status").notNull().default("planning"), // planning, building, completed, error
  metadata: jsonb("metadata"), // stores project configuration and progress
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  projectId: integer("project_id").references(() => projects.id),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => chatSessions.id),
  type: text("type").notNull(), // user, assistant, system
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // stores additional data like status, actions, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const generatedFiles = pgTable("generated_files", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  messageId: integer("message_id").references(() => chatMessages.id),
  filename: text("filename").notNull(),
  filepath: text("filepath").notNull(),
  content: text("content").notNull(),
  fileType: text("file_type").notNull(), // py, js, html, css, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  chatSessions: many(chatSessions),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  chatSessions: many(chatSessions),
  generatedFiles: many(generatedFiles),
}));

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [chatSessions.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [chatSessions.projectId],
    references: [projects.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.sessionId],
    references: [chatSessions.id],
  }),
  generatedFiles: one(generatedFiles, {
    fields: [chatMessages.id],
    references: [generatedFiles.messageId],
  }),
}));

export const generatedFilesRelations = relations(generatedFiles, ({ one }) => ({
  project: one(projects, {
    fields: [generatedFiles.projectId],
    references: [projects.id],
  }),
  message: one(chatMessages, {
    fields: [generatedFiles.messageId],
    references: [chatMessages.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertGeneratedFileSchema = createInsertSchema(generatedFiles).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type GeneratedFile = typeof generatedFiles.$inferSelect;
export type InsertGeneratedFile = z.infer<typeof insertGeneratedFileSchema>;
