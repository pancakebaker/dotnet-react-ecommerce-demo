import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import type { User } from '../../models';
import type { ApiClient } from '../../services/apiClient';

type LoginScreenProps = {
  api: ApiClient;
  onAuthenticated: (token: string, user: User) => void;
  onBack: () => void;
};

export function LoginScreen({ api, onAuthenticated, onBack }: LoginScreenProps) {
  const [email, setEmail] = useState('admin@ecommerce-demo.test');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');

    try {
      const auth = await api.login(email, password);
      onAuthenticated(auth.token, auth.user);
    } catch {
      setError('Sign in failed');
    }
  }

  return (
    <main className="min-h-screen bg-field lg:grid lg:grid-cols-2">
      <section className="grid min-h-screen place-items-center p-4 sm:p-8" aria-labelledby="login-heading">
        <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-sm">
          <button
            type="button"
            className="focus-ring mb-4 inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm hover:bg-field"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Storefront
          </button>
          <h1 id="login-heading" className="text-2xl font-semibold">Ecommerce Demo</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Sign in to manage customers, products, orders, and dashboard activity.</p>
          <div className="mt-6 space-y-4">
            <label className="block text-sm font-medium">
              Email
              <input className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2" type="email" maxLength={255} autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} />
            </label>
            <label className="block text-sm font-medium">
              Password
              <span className="relative mt-1 block">
                <input
                  className="focus-ring w-full rounded-md border border-line py-2 pl-3 pr-11"
                  type={showPassword ? 'text' : 'password'}
                  maxLength={128}
                  autoComplete="current-password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="focus-ring absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-slate-500 hover:bg-field hover:text-ink"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(current => !current)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>
          </div>
          {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
          <button className="focus-ring mt-6 w-full rounded-md bg-brand px-4 py-2 font-medium text-white hover:bg-teal-800">Sign in</button>
        </form>
      </section>
      <section className="relative hidden min-h-screen overflow-hidden lg:block" aria-label="Ecommerce Demo staff workspace visual">
        <picture className="block h-full w-full">
          <source type="image/webp" srcSet="/images/ecommerce-demo-login-workspace.webp" />
          <img
            src="/images/ecommerce-demo-login-workspace.jpg"
            alt="Organized order management workspace with scanner, printer, inventory labels, and shipping boxes"
            className="h-full w-full object-cover"
            loading="eager"
          />
        </picture>
      </section>
    </main>
  );
}
