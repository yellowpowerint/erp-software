export type UserRole =
  | 'SUPER_ADMIN'
  | 'CEO'
  | 'CFO'
  | 'DEPARTMENT_HEAD'
  | 'ACCOUNTANT'
  | 'PROCUREMENT_OFFICER'
  | 'OPERATIONS_MANAGER'
  | 'IT_MANAGER'
  | 'HR_MANAGER'
  | 'SAFETY_OFFICER'
  | 'WAREHOUSE_MANAGER'
  | 'EMPLOYEE'
  | 'VENDOR';

export interface MeResponse {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
}

export interface LoginResponse {
  access_token: string;
  user: MeResponse;
}
