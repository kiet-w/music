import { UserRole } from '@prisma/client';

export type AuthResponseDto = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name?: string | null;
    role: UserRole;
  };
};
