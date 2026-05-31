export type AuthResponseDto = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name?: string | null;
  };
};
