export type Role = 'Admin' | 'Staff';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: User;
}
