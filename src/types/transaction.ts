// Transaction types for purchase flow

export type TransactionStatus = 
  | 'PENDING'
  | 'DEPOSIT_PAID'      // Đã cọc 10%
  | 'COMPLETED'         // Đã thanh toán đủ 100%
  | 'CANCELLED'         // Hủy bỏ
  | 'REFUNDED'          // Hoàn tiền
  | 'DISPUTED';         // Tranh chấp

export type PaymentMethod = 'MOMO' | 'WALLET';
export type ListingType = 'VEHICLE' | 'BATTERY';

export interface Transaction {
  id: string;
  userId: string;
  vehicleId?: string;
  batteryId?: string;
  amount: number;
  depositAmount?: number;      // Số tiền cọc (10%)
  remainderAmount?: number;    // Số tiền còn lại (90%)
  status: TransactionStatus;
  paymentMethod: PaymentMethod;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutPayload {
  listingId: string;
  listingType: ListingType;
  paymentMethod: PaymentMethod;
  redirectUrl: string;
}

export interface PaymentInfo {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  responseTime: number;
  message: string;
  resultCode: number;
  payUrl: string;
  deeplink: string;
  qrCodeUrl: string;
  deeplinkMiniApp: string;
}

export interface CheckoutResponse {
  message: string;
  data: {
    transactionId: string;
    paymentInfo: PaymentInfo;
  };
}

export interface PayRemainderPayload {
  paymentMethod: PaymentMethod;
  redirectUrl: string;
}

export interface PayRemainderResponse {
  message: string;
  data: {
    transactionId: string;
    paymentInfo: PaymentInfo;
  };
}

export interface TransactionDetail extends Transaction {
  vehicle?: {
    id: string;
    title: string;
    images: string[];
    price: number;
  };
  battery?: {
    id: string;
    name: string;
    images: string[];
    price: number;
  };
  appointment?: {
    id: string;
    confirmedDate: string | null;
    status: string;
  };
}
