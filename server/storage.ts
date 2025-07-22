import { 
  users, projects, chatSessions, chatMessages, generatedFiles,
  type User, type InsertUser,
  type Project, type InsertProject,
  type ChatSession, type InsertChatSession,
  type ChatMessage, type InsertChatMessage,
  type GeneratedFile, type InsertGeneratedFile
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Projects
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByUser(userId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, updates: Partial<Project>): Promise<Project>;

  // Chat Sessions
  getChatSession(id: number): Promise<ChatSession | undefined>;
  getChatSessionsByUser(userId: number): Promise<ChatSession[]>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;

  // Chat Messages
  getChatMessage(id: number): Promise<ChatMessage | undefined>;
  getChatMessagesBySession(sessionId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  updateChatMessage(id: number, updates: Partial<ChatMessage>): Promise<ChatMessage>;

  // Generated Files
  getGeneratedFile(id: number): Promise<GeneratedFile | undefined>;
  getGeneratedFilesByProject(projectId: number): Promise<GeneratedFile[]>;
  createGeneratedFile(file: InsertGeneratedFile): Promise<GeneratedFile>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Projects
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getProjectsByUser(userId: number): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.updatedAt));
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(insertProject)
      .returning();
    return project;
  }

  async updateProject(id: number, updates: Partial<Project>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  // Chat Sessions
  async getChatSession(id: number): Promise<ChatSession | undefined> {
    const [session] = await db.select().from(chatSessions).where(eq(chatSessions.id, id));
    return session || undefined;
  }

  async getChatSessionsByUser(userId: number): Promise<ChatSession[]> {
    return await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.updatedAt));
  }

  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const [session] = await db
      .insert(chatSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  // Chat Messages
  async getChatMessage(id: number): Promise<ChatMessage | undefined> {
    const [message] = await db.select().from(chatMessages).where(eq(chatMessages.id, id));
    return message || undefined;
  }

  async getChatMessagesBySession(sessionId: number): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.createdAt);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async updateChatMessage(id: number, updates: Partial<ChatMessage>): Promise<ChatMessage> {
    const [message] = await db
      .update(chatMessages)
      .set(updates)
      .where(eq(chatMessages.id, id))
      .returning();
    return message;
  }

  // Generated Files
  async getGeneratedFile(id: number): Promise<GeneratedFile | undefined> {
    const [file] = await db.select().from(generatedFiles).where(eq(generatedFiles.id, id));
    return file || undefined;
  }

  async getGeneratedFilesByProject(projectId: number): Promise<GeneratedFile[]> {
    return await db
      .select()
      .from(generatedFiles)
      .where(eq(generatedFiles.projectId, projectId))
      .orderBy(generatedFiles.createdAt);
  }

  async createGeneratedFile(insertFile: InsertGeneratedFile): Promise<GeneratedFile> {
    const [file] = await db
      .insert(generatedFiles)
      .values(insertFile)
      .returning();
    return file;
  }
}

export const storage = new DatabaseStorage();
