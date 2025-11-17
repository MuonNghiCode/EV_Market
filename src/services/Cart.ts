// Cart Service - Manage shopping cart for batteries

import { ensureValidToken, getAuthToken } from './Auth';
import type {
  Cart,
  CartResponse,
  AddToCartPayload,
  AddToCartResponse,
  CartCheckoutPayload,
  CartCheckoutResponse,
} from '@/types/cart';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT || 'https://evmarket-api-staging-backup.onrender.com/api/v1';

/**
 * Get user's shopping cart
 */
export async function getCart(): Promise<CartResponse> {
  try {
    await ensureValidToken();
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/cart`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch cart');
    }

    const data: CartResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching cart:', error);
    throw error;
  }
}

/**
 * Add battery to cart
 */
export async function addToCart(batteryId: string): Promise<AddToCartResponse> {
  try {
    await ensureValidToken();
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const payload: AddToCartPayload = {
      batteryId,
    };

    const response = await fetch(`${API_BASE_URL}/cart/items`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to add item to cart');
    }

    const data: AddToCartResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
}

/**
 * Remove item from cart
 */
export async function removeFromCart(itemId: string): Promise<{ message: string }> {
  try {
    await ensureValidToken();
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/cart/items/${itemId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to remove item from cart');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
}

/**
 * Checkout cart - Create transaction and initiate payment for all items
 */
export async function checkoutCart(
  paymentMethod: 'MOMO' | 'WALLET',
  redirectUrl: string
): Promise<CartCheckoutResponse> {
  try {
    await ensureValidToken();
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const payload: CartCheckoutPayload = {
      paymentMethod,
      redirectUrl,
    };

    const response = await fetch(`${API_BASE_URL}/checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to checkout cart');
    }

    const data: CartCheckoutResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error checkout cart:', error);
    throw error;
  }
}

/**
 * Get cart item count for display in header
 */
export async function getCartItemCount(): Promise<number> {
  try {
    const cartData = await getCart();
    return cartData.data.items.length;
  } catch (error) {
    console.error('Error getting cart count:', error);
    return 0;
  }
}
