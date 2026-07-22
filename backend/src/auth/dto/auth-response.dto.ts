import { UserRole } from '@prisma/client';

export type AuthResponseDto = {
  accessToken: string;
  refreshToken?: string;
  refreshTokenId?: string;
  user?: {
    id: string;
    email: string;
    name?: string | null;
    avatarUrl?: string | null;
    role: UserRole;
  };
};
