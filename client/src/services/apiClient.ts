import type {
  AuthResponse,
  Customer,
  CustomerForm,
  DashboardSummary,
  Order,
  PagedResult,
  Product,
  StorefrontCheckoutRequest,
  StorefrontPaymentIntentRequest,
  StorefrontPaymentIntentResponse,
  User
} from '../models';

const API_URL = import.meta.env.VITE_API_URL ?? '';

type ApiProblemDetails = {
  title?: string;
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly validationErrors: string[] = []
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  constructor(private getToken: () => string | null) {}

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async profile(): Promise<User> {
    return this.request<User>('/api/profile');
  }

  async dashboard(): Promise<DashboardSummary> {
    return this.request<DashboardSummary>('/api/dashboard/summary');
  }

  async customers(search = ''): Promise<PagedResult<Customer>> {
    return this.request<PagedResult<Customer>>(`/api/customers?search=${encodeURIComponent(search)}&page=1&pageSize=8`);
  }

  async products(search = '', pageSize = 50): Promise<PagedResult<Product>> {
    return this.request<PagedResult<Product>>(`/api/products?search=${encodeURIComponent(search)}&page=1&pageSize=${pageSize}`);
  }

  async storefrontProducts(search = ''): Promise<Product[]> {
    return this.request<Product[]>(`/api/storefront/products?search=${encodeURIComponent(search)}`);
  }

  async placeStorefrontOrder(payload: StorefrontCheckoutRequest): Promise<Order> {
    return this.request<Order>('/api/storefront/orders', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async createStorefrontPaymentIntent(payload: StorefrontPaymentIntentRequest): Promise<StorefrontPaymentIntentResponse> {
    return this.request<StorefrontPaymentIntentResponse>('/api/storefront/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async orders(status = '', pageSize = 50): Promise<PagedResult<Order>> {
    const query = status ? `?status=${encodeURIComponent(status)}&page=1&pageSize=${pageSize}` : `?page=1&pageSize=${pageSize}`;
    return this.request<PagedResult<Order>>(`/api/orders${query}`);
  }

  async createCustomer(payload: CustomerForm): Promise<Customer> {
    return this.request<Customer>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async updateOrderStatus(id: string, status: string): Promise<void> {
    await this.request<void>(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers
      }
    });

    if (!response.ok) throw await buildApiError(response);

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }
}

async function buildApiError(response: Response): Promise<ApiError> {
  const fallback = `${response.status} ${response.statusText}`;
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('json')) {
    const text = await response.text();
    return new ApiError(text || fallback, response.status);
  }

  try {
    const problem = await response.json() as ApiProblemDetails;
    const validationErrors = Object.values(problem.errors ?? {}).flat();
    const message = validationErrors.length > 0
      ? validationErrors.join(' ')
      : problem.detail ?? problem.message ?? problem.title ?? fallback;

    return new ApiError(message, response.status, validationErrors);
  } catch {
    return new ApiError(fallback, response.status);
  }
}
