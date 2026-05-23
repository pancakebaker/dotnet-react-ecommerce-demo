export interface Customer {
  id: string;
  name: string;
  companyName?: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export type CustomerForm = Omit<Customer, 'id' | 'createdAt'>;
