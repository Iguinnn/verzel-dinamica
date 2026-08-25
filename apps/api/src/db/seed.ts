import { eq } from "drizzle-orm";

import { hashPassword } from "../auth/password.js";
import { createDatabaseClient } from "./client.js";
import { users } from "./schema.js";

type SeedAccount = {
  name: string;
  email: string;
  password: string;
  role: "USER" | "ADMIN";
};

function readAdmin(): SeedAccount {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const name = process.env.ADMIN_NAME?.trim() || "Administrador";

  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD are required to seed the administrator",
    );
  }

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must have at least 8 characters");
  }

  return { name, email, password, role: "ADMIN" };
}

function readDemoDriver(): SeedAccount | undefined {
  const email = process.env.DEMO_USER_EMAIL?.trim().toLowerCase();
  const password = process.env.DEMO_USER_PASSWORD ?? "";
  const name = process.env.DEMO_USER_NAME?.trim() || "Motorista Demo";

  if (!email && !password) {
    return undefined;
  }

  if (!email || !password) {
    throw new Error(
      "DEMO_USER_EMAIL and DEMO_USER_PASSWORD must be provided together",
    );
  }

  if (password.length < 8) {
    throw new Error("DEMO_USER_PASSWORD must have at least 8 characters");
  }

  return { name, email, password, role: "USER" };
}

async function upsertUser(
  db: ReturnType<typeof createDatabaseClient>["db"],
  account: SeedAccount,
) {
  const [existing] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, account.email))
    .limit(1);

  if (existing) {
    console.log(`Skipping existing ${account.role}: ${account.email}`);
    return;
  }

  await db.insert(users).values({
    name: account.name,
    email: account.email,
    passwordHash: await hashPassword(account.password),
    role: account.role,
  });

  console.log(`Created ${account.role}: ${account.email}`);
}

async function seed() {
  const { db, pool } = createDatabaseClient();

  try {
    await upsertUser(db, readAdmin());
    const demoDriver = readDemoDriver();
    if (demoDriver) {
      await upsertUser(db, demoDriver);
    }
  } finally {
    await pool.end();
  }
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
