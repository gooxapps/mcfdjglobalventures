import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CartItem, Product, ProductVariant } from '@/src/types/store';

const CART_STORAGE_KEY = 'mcfdj_global_cart_v1';

interface AddToCartOptions {
  size?: string;
  colour?: string;
  variant?: ProductVariant;
  quantity?: number;
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addToCart: (product: Product, options?: AddToCartOptions) => void;
  updateQuantity: (itemKey: string, quantity: number) => void;
  updateItemVariant: (itemKey: string, updates: { size?: string; colour?: string }) => void;
  removeItem: (itemKey: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function makeCartKey(productId: string, size: string, colour: string): string {
  return `${productId}__${size || 'STD'}__${colour || 'DEFAULT'}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore corrupted localStorage
    }
    return [];
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage quota errors
    }
  }, [items]);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const addToCart = useCallback((product: Product, options: AddToCartOptions = {}) => {
    const size = options.variant?.size ?? options.size ?? (product.available_sizes[0] || '');
    const colour =
      options.variant?.colour ??
      options.colour ??
      (product.available_colours[0]?.name || '');
    const qty = Math.max(1, options.quantity ?? 1);

    const basePrice =
      product.is_on_sale && product.discounted_price !== null
        ? Number(product.discounted_price)
        : Number(product.regular_price);

    const unitPrice =
      options.variant?.price_override !== null && options.variant?.price_override !== undefined
        ? Number(options.variant.price_override)
        : basePrice;

    const maxStock = options.variant ? options.variant.stock_quantity : product.stock_quantity;
    const key = makeCartKey(product.id, size, colour);

    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.key === key);
      if (existingIdx >= 0) {
        const next = [...prev];
        const current = next[existingIdx];
        const updatedQty =
          maxStock > 0 ? Math.min(maxStock, current.quantity + qty) : current.quantity + qty;
        next[existingIdx] = { ...current, quantity: updatedQty };
        return next;
      }

      const newItem: CartItem = {
        key,
        productId: product.id,
        variantId: options.variant?.id,
        name: product.name,
        slug: product.slug,
        sku: options.variant?.sku || product.sku,
        imageUrl: product.main_image_url || product.images?.[0]?.url || null,
        size,
        colour,
        unitPrice,
        regularPrice: Number(product.regular_price),
        currency: product.currency || 'CAD',
        quantity: maxStock > 0 ? Math.min(maxStock, qty) : qty,
        maxStock,
        availableSizes: product.available_sizes || [],
        availableColours: product.available_colours || [],
        variants: product.variants || [],
      };
      return [...prev, newItem];
    });
  }, []);

  const updateQuantity = useCallback((itemKey: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.key !== itemKey));
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.key !== itemKey) return item;
        const capped = item.maxStock > 0 ? Math.min(item.maxStock, quantity) : quantity;
        return { ...item, quantity: capped };
      })
    );
  }, []);

  const updateItemVariant = useCallback(
    (itemKey: string, updates: { size?: string; colour?: string }) => {
      setItems((prev) => {
        const target = prev.find((i) => i.key === itemKey);
        if (!target) return prev;
        const nextSize = updates.size !== undefined ? updates.size : target.size;
        const nextColour = updates.colour !== undefined ? updates.colour : target.colour;
        const nextKey = makeCartKey(target.productId, nextSize, nextColour);

        const matchedVariant = target.variants?.find(
          (v) =>
            v.is_available &&
            (!nextSize || v.size === nextSize) &&
            (!nextColour || v.colour === nextColour)
        );

        const updatedItem: CartItem = {
          ...target,
          key: nextKey,
          size: nextSize,
          colour: nextColour,
          variantId: matchedVariant?.id ?? target.variantId,
          sku: matchedVariant?.sku ?? target.sku,
        };

        const filtered = prev.filter((i) => i.key !== itemKey);
        const mergeIdx = filtered.findIndex((i) => i.key === nextKey);
        if (mergeIdx >= 0) {
          filtered[mergeIdx] = {
            ...filtered[mergeIdx],
            quantity: filtered[mergeIdx].quantity + updatedItem.quantity,
          };
          return filtered;
        }
        return [...filtered, updatedItem];
      });
    },
    []
  );

  const removeItem = useCallback((itemKey: string) => {
    setItems((prev) => prev.filter((i) => i.key !== itemKey));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        subtotal,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        addToCart,
        updateQuantity,
        updateItemVariant,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
