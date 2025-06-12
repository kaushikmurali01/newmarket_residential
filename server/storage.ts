import {
  users,
  audits,
  auditPhotos,
  type User,
  type InsertUser,
  type InsertAudit,
  type Audit,
  type InsertPhoto,
  type AuditPhoto,
  type CreateUser,
  type UpdateUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, or } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

export interface IStorage {
  // User operations for custom auth
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // User management operations
  getAllUsers(): Promise<User[]>;
  createManagedUser(userData: CreateUser, createdBy: number): Promise<User>;
  updateUser(id: number, updates: UpdateUser): Promise<User>;
  updateUserPassword(id: number, hashedPassword: string): Promise<void>;
  deleteUser(id: number): Promise<void>;
  getUserWithCreator(id: number): Promise<User & { creator?: User } | undefined>;
  
  // Session store
  sessionStore: any;
  
  // Audit operations
  createAudit(audit: InsertAudit): Promise<Audit>;
  updateAudit(id: string, audit: Partial<InsertAudit>): Promise<Audit>;
  getAudit(id: string): Promise<Audit | undefined>;
  getAuditsByUser(userId: string): Promise<Audit[]>;
  searchAudits(userId: string | null, query?: string, status?: string): Promise<Audit[]>;
  deleteAudit(id: string): Promise<void>;
  
  // Photo operations
  addPhoto(photo: InsertPhoto): Promise<AuditPhoto>;
  getPhotosByAudit(auditId: string): Promise<AuditPhoto[]>;
  getPhotosByCategory(auditId: string, category: string): Promise<AuditPhoto[]>;
  deletePhoto(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    const pgStore = connectPg(session);
    this.sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      ttl: 7 * 24 * 60 * 60, // 1 week in seconds
      tableName: "sessions",
    });
  }

  // User operations for custom auth
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  // User management operations
  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.isActive, true))
      .orderBy(desc(users.createdAt));
  }

  async createManagedUser(userData: CreateUser, createdBy: number): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        createdBy,
        role: 'auditor',
        isActive: true,
      })
      .returning();
    return user;
  }

  async updateUser(id: number, updates: UpdateUser): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async deleteUser(id: number): Promise<void> {
    await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async getUserWithCreator(id: number): Promise<User & { creator?: User } | undefined> {
    const [result] = await db
      .select({
        user: users,
        creator: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
        }
      })
      .from(users)
      .leftJoin(users as any, eq(users.createdBy, users.id))
      .where(eq(users.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.user,
      creator: result.creator.id ? result.creator as User : undefined
    } as User & { creator?: User };
  }

  // Audit operations
  async createAudit(audit: InsertAudit): Promise<Audit> {
    const [newAudit] = await db
      .insert(audits)
      .values(audit)
      .returning();
    return newAudit;
  }

  async updateAudit(id: string, auditData: Partial<InsertAudit>): Promise<Audit> {
    const [updatedAudit] = await db
      .update(audits)
      .set({ ...auditData, updatedAt: new Date() })
      .where(eq(audits.id, id))
      .returning();
    return updatedAudit;
  }

  async getAudit(id: string): Promise<Audit | undefined> {
    const [audit] = await db.select().from(audits).where(eq(audits.id, id));
    return audit;
  }

  async getAuditsByUser(userId: string): Promise<Audit[]> {
    return await db
      .select()
      .from(audits)
      .where(eq(audits.userId, parseInt(userId)))
      .orderBy(desc(audits.updatedAt));
  }

  async searchAudits(userId: string | null, query?: string, status?: string): Promise<Audit[]> {
    let whereConditions: any = undefined;

    // If userId is provided, filter by user; if null, show all audits
    if (userId !== null) {
      whereConditions = eq(audits.userId, parseInt(userId));
    }

    if (status && status !== "all") {
      const statusCondition = eq(audits.status, status);
      whereConditions = whereConditions ? and(whereConditions, statusCondition) : statusCondition;
    }

    if (query) {
      const searchCondition = or(
        ilike(audits.customerFirstName, `%${query}%`),
        ilike(audits.customerLastName, `%${query}%`),
        ilike(audits.customerAddress, `%${query}%`),
        ilike(audits.customerCity, `%${query}%`)
      );
      whereConditions = whereConditions ? and(whereConditions, searchCondition) : searchCondition;
    }

    const query_builder = db.select().from(audits);
    
    if (whereConditions) {
      query_builder.where(whereConditions);
    }

    return await query_builder.orderBy(desc(audits.updatedAt));
  }

  async deleteAudit(id: string): Promise<void> {
    await db.delete(audits).where(eq(audits.id, id));
  }

  // Photo operations
  async addPhoto(photo: InsertPhoto): Promise<AuditPhoto> {
    const [newPhoto] = await db
      .insert(auditPhotos)
      .values(photo)
      .returning();
    return newPhoto;
  }

  async getPhotosByAudit(auditId: string): Promise<AuditPhoto[]> {
    return await db
      .select()
      .from(auditPhotos)
      .where(eq(auditPhotos.auditId, auditId));
  }

  async getPhotosByCategory(auditId: string, category: string): Promise<AuditPhoto[]> {
    return await db
      .select()
      .from(auditPhotos)
      .where(and(eq(auditPhotos.auditId, auditId), eq(auditPhotos.category, category)));
  }

  async deletePhoto(id: string): Promise<void> {
    await db.delete(auditPhotos).where(eq(auditPhotos.id, id));
  }
}

export const storage = new DatabaseStorage();
