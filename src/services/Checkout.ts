import { ensureValidToken, getAuthToken } from './Auth'
import { 
  CheckoutPayload, 
  CheckoutResponse, 
  PayRemainderPayload, 
  PayRemainderResponse 
} from '@/types/transaction'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT || 'https://evmarket-api-staging-backup.onrender.com/api/v1'

export type ListingType = 'VEHICLE' | 'BATTERY'
export type PaymentMethod = 'MOMO' | 'WALLET'

export interface CheckoutRequest {
  listingId: string
  listingType: ListingType
  paymentMethod: PaymentMethod
  redirectUrl?: string
}

// Complete payment with wallet using a transactionId returned from checkout()
export interface WalletPaymentResponse {
  message: string
  data?: {
    id: string
    buyerId: string
    status: string
    vehicleId?: string | null
    batteryId?: string | null
    finalPrice: number
    paymentGateway: 'WALLET' | string
    paymentDetail?: any
    createdAt: string
    updatedAt: string
    [key: string]: any
  }
}

export const payWithWallet = async (transactionId: string): Promise<WalletPaymentResponse> => {
  try {
    const token = await ensureValidToken()

    const response = await fetch(`${API_BASE_URL}/checkout/${transactionId}/pay-with-wallet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        'Accept': 'application/json'
      },
      credentials: 'omit'
    })

    const text = await response.text()
    let json: any
    try {
      json = text ? JSON.parse(text) : {}
    } catch {
      json = { message: text }
    }

    if (!response.ok) {
      throw new CheckoutError(json?.message || 'Wallet payment failed', response.status)
    }

    return json as WalletPaymentResponse
  } catch (err: any) {
    if (err instanceof CheckoutError) throw err
    if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
      throw new CheckoutError('Cannot connect to server. Please try again later.')
    }
    throw new CheckoutError(err?.message || 'Unknown wallet payment error')
  }
}

// Removed duplicate CheckoutResponse interface declaration to resolve import conflict.

export class CheckoutError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message)
    this.name = 'CheckoutError'
  }
}

export const checkout = async (payload: CheckoutRequest): Promise<CheckoutResponse> => {
  try {
    const token = await ensureValidToken()

    console.log('Sending checkout request:', {
      url: `${API_BASE_URL}/checkout`,
      payload,
      hasToken: !!token
    });

    const response = await fetch(`${API_BASE_URL}/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        'Accept': 'application/json'
      },
      credentials: 'omit',
      body: JSON.stringify(payload)
    })

    const text = await response.text()
    let json: any
    try {
      json = text ? JSON.parse(text) : {}
    } catch {
      json = { message: text }
    }

    console.log('Checkout response:', {
      status: response.status,
      ok: response.ok,
      body: json
    });

    if (!response.ok) {
      const errorMessage = json?.message || json?.error || 'Checkout failed';
      console.error('Checkout error:', errorMessage, json);
      throw new CheckoutError(errorMessage, response.status)
    }

    return json as CheckoutResponse
  } catch (err: any) {
    console.error('Checkout exception:', err);
    if (err instanceof CheckoutError) throw err
    if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
      throw new CheckoutError('Cannot connect to server. Please try again later.')
    }
    throw new CheckoutError(err?.message || 'Unknown checkout error')
  }
}

/**
 * Initiate checkout process with 10% deposit payment
 * This is the new flow where buyer pays 10% deposit first
 * @param listingId - Vehicle or Battery ID
 * @param listingType - 'VEHICLE' or 'BATTERY'
 * @param paymentMethod - 'MOMO' or 'WALLET'
 * @param redirectUrl - URL to redirect after payment
 * @returns CheckoutResponse with payment URL and transaction ID
 */
export async function initiateCheckout(
  listingId: string,
  listingType: ListingType,
  paymentMethod: PaymentMethod,
  redirectUrl: string
): Promise<CheckoutResponse> {
  try {
    await ensureValidToken();
    const token = getAuthToken();
    
    if (!token) {
      throw new CheckoutError('Authentication required');
    }

    const payload: CheckoutPayload = {
      listingId,
      listingType,
      paymentMethod,
      redirectUrl
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
      throw new CheckoutError(errorData.message || 'Checkout failed', response.status);
    }

    const data: CheckoutResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error initiating checkout:', error);
    if (error instanceof CheckoutError) throw error;
    throw new CheckoutError('Failed to initiate checkout');
  }
}

/**
 * Pay the remaining 90% after buyer inspects and accepts the vehicle/battery
 * @param transactionId - The transaction ID from initial checkout
 * @param paymentMethod - 'MOMO' or 'WALLET'
 * @param redirectUrl - URL to redirect after payment
 * @returns PayRemainderResponse with payment URL
 */
export async function payRemainder(
  transactionId: string,
  paymentMethod: PaymentMethod,
  redirectUrl: string
): Promise<PayRemainderResponse> {
  try {
    await ensureValidToken();
    const token = getAuthToken();
    
    if (!token) {
      throw new CheckoutError('Authentication required');
    }

    const payload: PayRemainderPayload = {
      paymentMethod,
      redirectUrl
    };

    const response = await fetch(
      `${API_BASE_URL}/transactions/${transactionId}/pay-remainder`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new CheckoutError(errorData.message || 'Failed to pay remainder', response.status);
    }

    const data: PayRemainderResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error paying remainder:', error);
    if (error instanceof CheckoutError) throw error;
    throw new CheckoutError('Failed to pay remainder');
  }
}

/**
 * Request refund for deposit when appointment is cancelled
 * @param transactionId - The transaction ID from initial checkout
 * @returns Response with refund status
 */
export async function requestRefund(transactionId: string): Promise<{ message: string; data?: any }> {
  try {
    await ensureValidToken();
    const token = getAuthToken();
    
    if (!token) {
      throw new CheckoutError('Authentication required');
    }

    const response = await fetch(
      `${API_BASE_URL}/transactions/${transactionId}/refund`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new CheckoutError(errorData.message || 'Failed to request refund', response.status);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error requesting refund:', error);
    if (error instanceof CheckoutError) throw error;
    throw new CheckoutError('Failed to request refund');
  }
}
