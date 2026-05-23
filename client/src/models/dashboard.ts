export interface Activity {
  entityType: string;
  entityId: string;
  action: string;
  description: string;
  createdAt: string;
}

export interface DashboardSummary {
  totalCustomers: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  monthlyRevenue: number;
  recentActivity: Activity[];
}
