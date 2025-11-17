// Appointment Service - Manage meeting schedules between buyers and sellers

import { 
  Appointment, 
  AppointmentsResponse, 
  AppointmentResponse,
  ProposeDatePayload,
  ConfirmDatePayload 
} from '@/types/appointment';
import { getAuthToken, ensureValidToken } from './Auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT || 'https://evmarket-api-staging-backup.onrender.com/api/v1';

/**
 * Get all appointments for the current user (both as buyer and seller)
 * @param page - Page number for pagination
 * @param limit - Number of results per page
 * @returns AppointmentsResponse with paginated appointments
 */
export async function getMyAppointments(
  page: number = 1, 
  limit: number = 10
): Promise<AppointmentsResponse> {
  try {
    await ensureValidToken();
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${API_BASE_URL}/appointments/me?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch appointments');
    }

    const data: AppointmentsResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching appointments:', error);
    throw error;
  }
}

/**
 * Propose meeting dates for an appointment (both buyer and seller can propose)
 * @param appointmentId - The appointment ID
 * @param proposedDates - Array of 3 proposed dates in ISO 8601 format with timezone
 * @returns AppointmentResponse with updated appointment
 */
export async function proposeAppointmentDate(
  appointmentId: string,
  proposedDates: string[]
): Promise<AppointmentResponse> {
  try {
    await ensureValidToken();
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    if (proposedDates.length !== 3) {
      throw new Error('Exactly 3 proposed dates are required');
    }

    const payload: ProposeDatePayload = {
      proposedDates
    };

    const response = await fetch(
      `${API_BASE_URL}/appointments/${appointmentId}/propose-date`,
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
      throw new Error(errorData.message || 'Failed to propose dates');
    }

    const data: AppointmentResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error proposing appointment dates:', error);
    throw error;
  }
}

/**
 * Confirm a specific meeting date from the proposed dates
 * @param appointmentId - The appointment ID
 * @param confirmedDate - The selected date in ISO 8601 format with timezone
 * @returns AppointmentResponse with confirmed appointment
 */
export async function confirmAppointment(
  appointmentId: string,
  confirmedDate: string
): Promise<AppointmentResponse> {
  try {
    await ensureValidToken();
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const payload: ConfirmDatePayload = {
      confirmedDate
    };

    const response = await fetch(
      `${API_BASE_URL}/appointments/${appointmentId}/confirm`,
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
      throw new Error(errorData.message || 'Failed to confirm appointment');
    }

    const data: AppointmentResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error confirming appointment:', error);
    throw error;
  }
}

/**
 * Cancel an appointment
 * @param appointmentId - The appointment ID
 * @returns AppointmentResponse with cancelled appointment
 */
export async function cancelAppointment(appointmentId: string): Promise<AppointmentResponse> {
  try {
    await ensureValidToken();
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${API_BASE_URL}/appointments/${appointmentId}/cancel`,
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
      throw new Error(errorData.message || 'Failed to cancel appointment');
    }

    const data: AppointmentResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    throw error;
  }
}

/**
 * Cancel appointment and request refund
 * @param appointmentId - The appointment ID
 * @param transactionId - The transaction ID for refund
 * @returns Object with appointment cancellation and refund status
 */
export async function cancelAppointmentWithRefund(
  appointmentId: string,
  transactionId: string
): Promise<{ appointment: AppointmentResponse; refund?: any; refundError?: string }> {
  try {
    // First, cancel the appointment
    const appointmentResult = await cancelAppointment(appointmentId);
    
    // Then, request refund (import dynamically to avoid circular dependency)
    try {
      const { requestRefund } = await import('./Checkout');
      const refundResult = await requestRefund(transactionId);
      return {
        appointment: appointmentResult,
        refund: refundResult
      };
    } catch (refundError: any) {
      console.error('Refund request failed:', refundError);
      return {
        appointment: appointmentResult,
        refundError: refundError.message || 'Refund request failed, please contact support'
      };
    }
  } catch (error) {
    console.error('Error cancelling appointment with refund:', error);
    throw error;
  }
}


/**
 * Format date for display
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export function formatAppointmentDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Check if user can propose dates (when other party has not proposed yet or waiting for counter-proposal)
 * @param appointment - The appointment object
 * @param userId - Current user ID
 * @returns boolean indicating if user can propose
 */
export function canProposeDate(appointment: Appointment, userId: string): boolean {
  const isBuyer = appointment.buyerId === userId;
  const isSeller = appointment.sellerId === userId;
  
  if (appointment.status !== 'PENDING') {
    return false;
  }
  
  // Buyer can propose if they haven't proposed yet or seller has proposed
  if (isBuyer) {
    return appointment.buyerProposedDates.length === 0 || appointment.sellerProposedDates.length > 0;
  }
  
  // Seller can propose if they haven't proposed yet or buyer has proposed
  if (isSeller) {
    return appointment.sellerProposedDates.length === 0 || appointment.buyerProposedDates.length > 0;
  }
  
  return false;
}

/**
 * Check if user can confirm appointment (when other party has proposed dates)
 * @param appointment - The appointment object
 * @param userId - Current user ID
 * @returns boolean indicating if user can confirm
 */
export function canConfirmAppointment(appointment: Appointment, userId: string): boolean {
  const isBuyer = appointment.buyerId === userId;
  const isSeller = appointment.sellerId === userId;
  
  if (appointment.status !== 'PENDING') {
    return false;
  }
  
  // Buyer can confirm if seller has proposed dates
  if (isBuyer && appointment.sellerProposedDates.length > 0) {
    return true;
  }
  
  // Seller can confirm if buyer has proposed dates
  if (isSeller && appointment.buyerProposedDates.length > 0) {
    return true;
  }
  
  return false;
}
