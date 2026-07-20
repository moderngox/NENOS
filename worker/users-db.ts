export interface UserRow {
  id: string;
  email: string;
  name: string | null;
  password_hash: string | null;
  is_admin: number;
}

export async function getUserByEmail(db: D1Database, email: string): Promise<UserRow | null> {
  return db.prepare(`SELECT id, email, name, password_hash, is_admin FROM users WHERE email = ?`).bind(email).first<UserRow>();
}

export async function getUserById(db: D1Database, id: string): Promise<UserRow | null> {
  return db.prepare(`SELECT id, email, name, password_hash, is_admin FROM users WHERE id = ?`).bind(id).first<UserRow>();
}

export async function createUser(
  db: D1Database,
  params: { email: string; name: string | null; passwordHash: string | null }
): Promise<UserRow> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db
    .prepare(`INSERT INTO users (id, email, name, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(id, params.email, params.name, params.passwordHash, now, now)
    .run();
  return { id, email: params.email, name: params.name, password_hash: params.passwordHash, is_admin: 0 };
}

export async function findUserByOAuthIdentity(db: D1Database, provider: string, providerUserId: string): Promise<UserRow | null> {
  return db
    .prepare(
      `SELECT users.id as id, users.email as email, users.name as name, users.password_hash as password_hash, users.is_admin as is_admin
       FROM oauth_identities JOIN users ON users.id = oauth_identities.user_id
       WHERE oauth_identities.provider = ? AND oauth_identities.provider_user_id = ?`
    )
    .bind(provider, providerUserId)
    .first<UserRow>();
}

export async function linkOAuthIdentity(db: D1Database, userId: string, provider: string, providerUserId: string): Promise<void> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db
    .prepare(`INSERT INTO oauth_identities (id, user_id, provider, provider_user_id, created_at) VALUES (?, ?, ?, ?, ?)`)
    .bind(id, userId, provider, providerUserId, now)
    .run();
}
