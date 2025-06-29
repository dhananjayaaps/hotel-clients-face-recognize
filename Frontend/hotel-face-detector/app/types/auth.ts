export interface User {
  token(token: any): unknown;
  id: string;
  email: string;
  fullName: string;
  role: 'guest' | 'admin' | 'staff';
  phone?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface SignupResponse {
  userId: string;
  token: string;
}