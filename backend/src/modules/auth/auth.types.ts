import { SessionResult } from '../../services/tokens';

export interface AuthUserResponse {
  id: string;
  username: string;
  role: string;
  class?: {
    id: string;
    name: string;
  } | null;
}

export interface LoginResult {
  user: AuthUserResponse;
  tokens: SessionResult & { sessionToken?: string };
  session?: {
    id: string;
    sessionToken: string;
    expiresAt: Date;
  };
}

export interface ClassResponse {
  id: string;
  name: string;
  createdAt: Date;
}
