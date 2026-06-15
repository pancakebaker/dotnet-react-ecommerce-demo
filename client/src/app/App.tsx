import { useMemo, useState } from 'react';
import { BarChart3, LogOut } from 'lucide-react';
import { LoginScreen } from '../features/auth/LoginScreen';
import { CustomersView } from '../features/customers/CustomersView';
import { DashboardView } from '../features/dashboard/DashboardView';
import { OrdersView } from '../features/orders/OrdersView';
import { ProductsView } from '../features/products/ProductsView';
import { ProfileView } from '../features/profile/ProfileView';
import { StorefrontPage } from '../features/storefront/StorefrontPage';
import type { BackOfficeView, User } from '../models';
import { canAccess } from '../permissions/permissions';
import { ApiClient } from '../services/apiClient';
import { navItems } from './navigation';

const tokenStorageKey = 'ecommerce-demo.token';
const userStorageKey = 'ecommerce-demo.user';

function readStoredUser(): User | null {
  const raw = localStorage.getItem(userStorageKey);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    localStorage.removeItem(userStorageKey);
    return null;
  }
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(tokenStorageKey));
  const [user, setUser] = useState<User | null>(() => readStoredUser());
  const [view, setView] = useState<BackOfficeView>('dashboard');
  const [showLogin, setShowLogin] = useState(false);
  const api = useMemo(() => new ApiClient(() => token), [token]);

  function handleAuthenticated(authToken: string, authUser: User) {
    localStorage.setItem(tokenStorageKey, authToken);
    localStorage.setItem(userStorageKey, JSON.stringify(authUser));
    setToken(authToken);
    setUser(authUser);
  }

  function logout() {
    localStorage.removeItem(tokenStorageKey);
    localStorage.removeItem(userStorageKey);
    setToken(null);
    setUser(null);
    setShowLogin(false);
  }

  if (!token || !user) {
    return showLogin
      ? <LoginScreen api={api} onAuthenticated={handleAuthenticated} onBack={() => setShowLogin(false)} />
      : <StorefrontPage api={api} onSignIn={() => setShowLogin(true)} />;
  }

  const visibleNavItems = navItems.filter(item => canAccess(user.role, item.resource, item.action));
  const activeItem = visibleNavItems.find(item => item.id === view) ?? visibleNavItems[0];
  const ActiveIcon = activeItem?.icon ?? BarChart3;
  const activeView = activeItem?.id ?? 'profile';

  return (
    <div className="min-h-screen bg-field text-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-white lg:block">
        <div className="flex h-16 items-center border-b border-line px-6">
          <span className="text-lg font-semibold">Ecommerce Demo</span>
        </div>
        <nav className="space-y-1 p-3">
          {visibleNavItems.map(item => (
            <button
              key={item.id}
              className={`focus-ring flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm ${activeView === item.id ? 'bg-teal-50 text-brand' : 'hover:bg-field'}`}
              onClick={() => setView(item.id)}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-line bg-white">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <ActiveIcon className="h-5 w-5 text-brand" />
              <h1 className="truncate text-lg font-semibold">{activeItem?.label}</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-slate-600 sm:inline">{user.firstName} {user.lastName}</span>
              <button className="focus-ring rounded-md border border-line p-2 hover:bg-field" onClick={logout} title="Log out">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-line px-3 py-2 lg:hidden">
            {visibleNavItems.map(item => (
              <button
                key={item.id}
                className={`focus-ring rounded-md px-3 py-2 text-sm ${activeView === item.id ? 'bg-teal-50 text-brand' : 'bg-white'}`}
                onClick={() => setView(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </header>

        <main className="mx-auto max-w-7xl p-4 sm:p-6">
          {activeView === 'dashboard' && <DashboardView api={api} />}
          {activeView === 'customers' && <CustomersView api={api} role={user.role} />}
          {activeView === 'products' && <ProductsView api={api} role={user.role} />}
          {activeView === 'orders' && <OrdersView api={api} role={user.role} />}
          {activeView === 'profile' && <ProfileView user={user} api={api} />}
        </main>
      </div>
    </div>
  );
}

export default App;
