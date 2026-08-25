import { eq } from "drizzle-orm";

import type { User, UserRole } from "@parking/contracts";

import type { Database } from "../db/client.js";
import { users } from "../db/schema.js";

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUserData = {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
};

export interface UserRepository {
  findById(id: string): Promise<UserRecord | undefined>;
  findByEmail(email: string): Promise<UserRecord | undefined>;
  list(): Promise<UserRecord[]>;
  create(data: CreateUserData): Promise<UserRecord>;
}

export function toPublicUser(record: UserRecord): User {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function mapRow(row: typeof users.$inferSelect): UserRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createUserRepository(db: Database): UserRepository {
  return {
    async findById(id) {
      const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return row ? mapRow(row) : undefined;
    },

    async findByEmail(email) {
      const [row] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      return row ? mapRow(row) : undefined;
    },

    async list() {
      const rows = await db.select().from(users).orderBy(users.name, users.id);
      return rows.map(mapRow);
    },

    async create(data) {
      const [row] = await db.insert(users).values(data).returning();
      if (!row) {
        throw new Error("USER_INSERT_FAILED");
      }
      return mapRow(row);
    },
  };
}

export function createMemoryUserRepository(
  initial: UserRecord[] = [],
): UserRepository {
  const records = [...initial];

  return {
    async findById(id) {
      return records.find((user) => user.id === id);
    },

    async findByEmail(email) {
      return records.find((user) => user.email === email);
    },

    async list() {
      return [...records].sort((a, b) => {
        const byName = a.name.localeCompare(b.name);
        return byName !== 0 ? byName : a.id.localeCompare(b.id);
      });
    },

    async create(data) {
      if (records.some((user) => user.email === data.email)) {
        throw Object.assign(new Error("EMAIL_ALREADY_EXISTS"), {
          code: "23505",
        });
      }

      const now = new Date();
      const record: UserRecord = {
        id: crypto.randomUUID(),
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
        createdAt: now,
        updatedAt: now,
      };
      records.push(record);
      return record;
    },
  };
}
