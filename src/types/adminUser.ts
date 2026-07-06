export interface AdminUser {
  id: number;
  username: string;
  email: string;
  credits_remaining: number;
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
  last_login: string | null;
}
