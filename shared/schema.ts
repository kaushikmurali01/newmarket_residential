import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  boolean,
  integer,
  decimal,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for custom authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username").unique().notNull(),
  email: varchar("email").unique(),
  password: varchar("password").notNull(), // Will be hashed
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: varchar("role").default("auditor"), // auditor, admin, manager
  canManageUsers: boolean("can_manage_users").default(false), // Permission to manage other users
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audits table
export const audits = pgTable("audits", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").notNull().references(() => users.id),
  status: varchar("status").notNull().default("draft"), // draft, in_progress, completed
  customerFirstName: varchar("customer_first_name"),
  customerLastName: varchar("customer_last_name"),
  customerEmail: varchar("customer_email"),
  customerPhone: varchar("customer_phone"),
  customerAddress: varchar("customer_address"),
  customerCity: varchar("customer_city"),
  customerProvince: varchar("customer_province"),
  customerPostalCode: varchar("customer_postal_code"),
  auditType: varchar("audit_type"), // before_upgrade, after_upgrade
  homeType: varchar("home_type"), // single_detached, attached, row_end, row_mid
  auditDate: timestamp("audit_date"),
  
  // Pre-audit information
  eligibilityCriteria: jsonb("eligibility_criteria"),
  preAuditDiscussion: jsonb("pre_audit_discussion"),
  atypicalLoads: jsonb("atypical_loads"),
  
  // House information
  houseInfo: jsonb("house_info"),
  foundationInfo: jsonb("foundation_info"),
  wallsInfo: jsonb("walls_info"),
  ceilingInfo: jsonb("ceiling_info"),
  windowsInfo: jsonb("windows_info"),
  doorsInfo: jsonb("doors_info"),
  ventilationInfo: jsonb("ventilation_info"),
  heatingInfo: jsonb("heating_info"),
  domesticHotWaterInfo: jsonb("domestic_hot_water_info"),
  renewablesInfo: jsonb("renewables_info"),
  
  // Tests
  blowerDoorTest: jsonb("blower_door_test"),
  depressurizationTest: jsonb("depressurization_test"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Photos table
export const auditPhotos = pgTable("audit_photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  auditId: uuid("audit_id").notNull().references(() => audits.id, { onDelete: "cascade" }),
  category: varchar("category").notNull(), // exterior, heating_system, hot_water, hrv_erv, renewables, attic_insulation, blower_door
  filename: varchar("filename").notNull(),
  originalName: varchar("original_name").notNull(),
  mimeType: varchar("mime_type").notNull(),
  size: integer("size").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Export schemas
export type InsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// User management schemas
export const createUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  firstName: true,
  lastName: true,
  canManageUsers: true,
}).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().optional().refine((val) => !val || val === "" || z.string().email().safeParse(val).success, {
    message: "Invalid email address",
  }),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional().refine((val) => !val || val === "" || z.string().email().safeParse(val).success, {
    message: "Invalid email address",
  }),
  role: z.enum(["user", "admin"]).optional(),
  canManageUsers: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdatePassword = z.infer<typeof updatePasswordSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export const insertAuditSchema = createInsertSchema(audits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPhotoSchema = createInsertSchema(auditPhotos).omit({
  id: true,
  uploadedAt: true,
});

export type InsertAudit = z.infer<typeof insertAuditSchema>;
export type Audit = typeof audits.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type AuditPhoto = typeof auditPhotos.$inferSelect;
