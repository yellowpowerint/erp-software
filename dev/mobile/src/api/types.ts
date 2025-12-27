export type Money = {
  amount: number;
  currency?: string | null;
};

export type ProjectRef = {
  id?: string;
  projectCode?: string | null;
  name?: string | null;
};

export type UserRef = {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

export type ApiListResponse<T> = {
  items: T[];
  page?: number;
  pageSize?: number;
  total?: number;
  hasNextPage?: boolean;
};

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
