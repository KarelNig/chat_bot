export interface Session {
  id: string; // UUID from profiles (or CURRENT_USER_ID in local mode)
  username: string;
}
