import { BarChart3, Boxes, ClipboardList, UserRound, UsersRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { BackOfficeView } from '../models';
import type { PermissionResource } from '../permissions/permissions';

type NavigationItem = {
  id: BackOfficeView;
  label: string;
  icon: LucideIcon;
  resource: PermissionResource;
  action: string;
};

export const navItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, resource: 'dashboard', action: 'view' },
  { id: 'customers', label: 'Customers', icon: UsersRound, resource: 'customers', action: 'view' },
  { id: 'products', label: 'Products', icon: Boxes, resource: 'products', action: 'view' },
  { id: 'orders', label: 'Orders', icon: ClipboardList, resource: 'orders', action: 'view' },
  { id: 'profile', label: 'Profile', icon: UserRound, resource: 'profile', action: 'view' }
];
