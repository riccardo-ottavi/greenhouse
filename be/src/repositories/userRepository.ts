import { db } from "../database/connection.js";
import { User } from "../types/User.js";

type UserRow = {
  id: number;
  username: string;
  passwordHash: string;
  isActive: number | boolean;
  createdAt: Date;
  updatedAt: Date;
};

export async function getUserByUsername(
  username: string
): Promise<User | undefined> {
  const [rows] = await db.query(
    `
      SELECT
        id,
        username,
        password_hash AS passwordHash,
        is_active AS isActive,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM users
      WHERE username = ?
      LIMIT 1
    `,
    [username]
  );

  const users = rows as UserRow[];

  if (!users[0]) {
    return undefined;
  }

  return {
    ...users[0],
    isActive: Boolean(users[0].isActive)
  };
}

export async function getUserById(
  id: number
): Promise<User | undefined> {
  const [rows] = await db.query(
    `
      SELECT
        id,
        username,
        password_hash AS passwordHash,
        is_active AS isActive,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );

  const users = rows as UserRow[];

  if (!users[0]) {
    return undefined;
  }

  return {
    ...users[0],
    isActive: Boolean(users[0].isActive)
  };
}
