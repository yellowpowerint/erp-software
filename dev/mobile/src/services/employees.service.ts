import { apiClient } from './api.service';

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department: string;
  position: string;
  status: 'active' | 'inactive' | 'on_leave';
  hireDate: string;
  profilePhoto?: string;
}

export interface EmployeeDetail extends Employee {
  salary?: number;
  bankAccount?: string;
  emergencyContact?: string;
  address?: string;
  dateOfBirth?: string;
  nationalId?: string;
  manager?: string;
  reports?: Employee[];
}

export interface EmployeeSearchParams {
  page?: number;
  pageSize?: number;
  search?: string;
  department?: string;
  status?: string;
}

export interface EmployeeSearchResponse {
  employees: Employee[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}

export const employeesService = {
  async searchEmployees(params: EmployeeSearchParams = {}): Promise<EmployeeSearchResponse> {
    try {
      const query = {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        ...(params.search ? { search: params.search } : {}),
        ...(params.department ? { department: params.department } : {}),
        ...(params.status ? { status: params.status } : {}),
      };

      const response = await apiClient.get<any>('/hr/employees', { params: query });

      return {
        employees: response.data.employees || [],
        page: response.data.page || 1,
        pageSize: response.data.pageSize || 20,
        totalPages: response.data.totalPages || 1,
        totalCount: response.data.totalCount || 0,
      };
    } catch (error) {
      console.error('Failed to search employees:', error);
      throw error;
    }
  },

  async getEmployeeProfile(id: string): Promise<EmployeeDetail> {
    try {
      const response = await apiClient.get<any>(`/hr/employees/${id}`);
      
      return {
        id: response.data.id,
        employeeId: response.data.employeeId,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        email: response.data.email,
        phone: response.data.phone,
        department: response.data.department,
        position: response.data.position,
        status: response.data.status || 'active',
        hireDate: response.data.hireDate,
        profilePhoto: response.data.profilePhoto,
        salary: response.data.salary,
        bankAccount: response.data.bankAccount,
        emergencyContact: response.data.emergencyContact,
        address: response.data.address,
        dateOfBirth: response.data.dateOfBirth,
        nationalId: response.data.nationalId,
        manager: response.data.manager,
        reports: response.data.reports || [],
      };
    } catch (error) {
      console.error('Failed to get employee profile:', error);
      throw error;
    }
  },

  async getDepartments(): Promise<string[]> {
    try {
      const response = await apiClient.get<any>('/hr/departments');
      return response.data.departments || [];
    } catch (error) {
      console.error('Failed to get departments:', error);
      return [];
    }
  },
};
