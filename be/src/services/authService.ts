import argon2 from "argon2";

import {
  getUserById,
  getUserByUsername
} from "../repositories/userRepository.js";

import { AuthenticatedUser } from "../types/User.js";

export async function authenticateUser(
  username: string,
  password: string
): Promise<AuthenticatedUser | null> {
  const user = await getUserByUsername(username);

  if (!user || !user.isActive) {
    return null;
  }

  const passwordMatches = await argon2.verify(
    user.passwordHash,
    password
  );

  if (!passwordMatches) {
    return null;
  }

  return {
    id: user.id,
    username: user.username
  };
}

export async function getActiveUserById(
  id: number
): Promise<AuthenticatedUser | null> {
  const user = await getUserById(id);

  if (!user || !user.isActive) {
    return null;
  }

  return {
    id: user.id,
    username: user.username
  };
}
