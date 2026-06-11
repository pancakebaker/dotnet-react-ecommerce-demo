import { useCallback, useEffect, useState } from 'react';
import type { Product } from '../../../models';
import { productSlug } from '../helpers/productSlugs';
import { applyStorefrontMetadata } from '../helpers/storefrontSeo';
import { checkoutPath, parseStorefrontRoute, productPath, productPathFromSlug, storefrontHomePath, type StorefrontRoute } from '../helpers/storefrontRoutes';

type UseStorefrontRoutingOptions = {
  hasCartItems: boolean;
};

function scrollToTop() {
  window.scrollTo({ top: 0 });
}

function replaceWithHome() {
  window.history.replaceState({}, '', storefrontHomePath);
}

function initialStorefrontRoute(hasCartItems: boolean): StorefrontRoute {
  const parsedRoute = parseStorefrontRoute(window.location.pathname);
  if (parsedRoute.view === 'checkout' && !hasCartItems) {
    return { view: 'home', productSlug: null };
  }

  return parsedRoute;
}

export function useStorefrontRouting({ hasCartItems }: UseStorefrontRoutingOptions) {
  const [route, setRoute] = useState<StorefrontRoute>(() => initialStorefrontRoute(hasCartItems));
  const [returnProductSlug, setReturnProductSlug] = useState<string | null>(
    route.view === 'product' ? route.productSlug : null
  );

  useEffect(() => {
    if (window.location.pathname === checkoutPath && !hasCartItems) {
      replaceWithHome();
    }
  }, [hasCartItems]);

  useEffect(() => {
    if (route.view !== 'product') {
      applyStorefrontMetadata();
    }
  }, [route.view]);

  useEffect(() => {
    function handlePopState() {
      const nextRoute = parseStorefrontRoute(window.location.pathname);
      if (nextRoute.view === 'checkout' && !hasCartItems) {
        replaceWithHome();
        setRoute({ view: 'home', productSlug: null });
        setReturnProductSlug(null);
        return;
      }

      setRoute(nextRoute);
      if (nextRoute.view === 'product') {
        setReturnProductSlug(nextRoute.productSlug);
      }
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [hasCartItems]);

  useEffect(() => {
    if (route.view !== 'checkout' || hasCartItems) {
      return;
    }

    replaceWithHome();
    setRoute({ view: 'home', productSlug: null });
    setReturnProductSlug(null);
  }, [hasCartItems, route.view]);

  const viewProduct = useCallback((product: Product) => {
    const path = productPath(product);
    window.history.pushState({}, '', path);
    const nextSlug = productSlug(product);
    setRoute({ view: 'product', productSlug: nextSlug });
    setReturnProductSlug(nextSlug);
    scrollToTop();
  }, []);

  const backToProducts = useCallback(() => {
    window.history.pushState({}, '', storefrontHomePath);
    setRoute({ view: 'home', productSlug: null });
    setReturnProductSlug(null);
    scrollToTop();
  }, []);

  const openCheckout = useCallback(() => {
    if (!hasCartItems) {
      replaceWithHome();
      setRoute({ view: 'home', productSlug: null });
      setReturnProductSlug(null);
      scrollToTop();
      return;
    }

    if (route.view === 'product') {
      setReturnProductSlug(route.productSlug);
    }

    window.history.pushState({}, '', checkoutPath);
    setRoute({ view: 'checkout', productSlug: null });
    scrollToTop();
  }, [hasCartItems, route.productSlug, route.view]);

  const closeCheckout = useCallback(() => {
    const path = productPathFromSlug(returnProductSlug);
    window.history.pushState({}, '', path);
    setRoute(returnProductSlug
      ? { view: 'product', productSlug: returnProductSlug }
      : { view: 'home', productSlug: null });
    scrollToTop();
  }, [returnProductSlug]);

  const resetToHome = useCallback(() => {
    setRoute({ view: 'home', productSlug: null });
    setReturnProductSlug(null);
    window.history.pushState({}, '', storefrontHomePath);
  }, []);

  return {
    route,
    viewProduct,
    backToProducts,
    openCheckout,
    closeCheckout,
    resetToHome
  };
}
