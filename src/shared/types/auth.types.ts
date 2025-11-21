// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  lastName?: string;
  rut?: string;
  phone?: string;
  roleId: string;
  role?: Role;
  status?: string;
  areas?: string[];
  warehouses?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
}

// API Error Response
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
