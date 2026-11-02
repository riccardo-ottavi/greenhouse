export type User = {
  id: number;
  username: string;
  passwordHash: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthenticatedUser = Pick<
  User,
  "id" | "username"
>;
