import { BarChart3, Boxes, ClipboardList, UserRound, UsersRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { BackOfficeView } from '../models';

type NavigationItem = {
  id: BackOfficeView;
  label: string;
  icon: LucideIcon;
};

export const navItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'customers', label: 'Customers', icon: UsersRound },
  { id: 'products', label: 'Products', icon: Boxes },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'profile', label: 'Profile', icon: UserRound }
];
