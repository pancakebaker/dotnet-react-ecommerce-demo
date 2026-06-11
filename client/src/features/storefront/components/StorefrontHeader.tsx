import { Store } from 'lucide-react';

type StorefrontHeaderProps = {
  onSignIn: () => void;
  onHome?: () => void;
};

export function StorefrontHeader({ onHome, onSignIn }: StorefrontHeaderProps) {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <a
          href="/"
          className="flex items-center gap-2 font-semibold"
          aria-label="Ecommerce Demo storefront home"
          onClick={event => {
            if (!onHome) return;
            event.preventDefault();
            onHome();
          }}
        >
          <Store className="h-5 w-5 text-brand" />
          Ecommerce Demo
        </a>
        <button className="focus-ring rounded-md border border-line px-3 py-2 text-sm hover:bg-field" onClick={onSignIn}>
          Staff sign in
        </button>
      </div>
    </header>
  );
}
