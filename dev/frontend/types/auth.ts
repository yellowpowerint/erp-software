export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  CEO = 'CEO',
  CFO = 'CFO',
  DEPARTMENT_HEAD = 'DEPARTMENT_HEAD',
  ACCOUNTANT = 'ACCOUNTANT',
  PROCUREMENT_OFFICER = 'PROCUREMENT_OFFICER',
  OPERATIONS_MANAGER = 'OPERATIONS_MANAGER',
  IT_MANAGER = 'IT_MANAGER',
  HR_MANAGER = 'HR_MANAGER',
  SAFETY_OFFICER = 'SAFETY_OFFICER',
  WAREHOUSE_MANAGER = 'WAREHOUSE_MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  department?: string;
  position?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
  department?: string;
  position?: string;
}
