import { useCallback, useMemo, useState } from 'react';
import type { CartItem, Product } from '../../../models';
import { addProductToCart, changeCartItemQuantity, getCartTotals, toStorefrontOrderItems } from '../helpers/storefrontCart';

export function useStorefrontCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const totals = useMemo(() => getCartTotals(cart), [cart]);
  const orderItems = useMemo(() => toStorefrontOrderItems(cart), [cart]);

  const addProduct = useCallback((product: Product) => {
    setCart(current => addProductToCart(current, product));
  }, []);

  const changeQuantity = useCallback((productId: string, delta: number) => {
    setCart(current => changeCartItemQuantity(current, productId, delta));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  return {
    cart,
    totals,
    orderItems,
    hasCartItems: cart.length > 0,
    addProduct,
    changeQuantity,
    clearCart
  };
}
