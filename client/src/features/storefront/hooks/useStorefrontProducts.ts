import { useEffect, useState } from 'react';
import type { Product } from '../../../models';
import type { ApiClient } from '../../../services/apiClient';

const productSearchDebounceMs = 250;

export function useStorefrontProducts(api: ApiClient, search: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const searchTerm = search.trim();

    setLoading(true);
    setError('');

    const timeoutId = window.setTimeout(() => {
      api.storefrontProducts(searchTerm)
        .then(nextProducts => {
          if (!active) return;
          setProducts(nextProducts);
        })
        .catch(() => {
          if (!active) return;
          setProducts([]);
          setError('Products could not be loaded. Please try again.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, productSearchDebounceMs);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [api, search]);

  return { products, loading, error };
}
