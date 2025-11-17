// Cart types for battery shopping cart system

export interface CartBattery {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string | null;
  images: string[];
  status: string;
  brand: string;
  capacity: number;
  year: number;
  health: number;
  specifications: any;
  isAuction: boolean;
  auctionStartsAt: string | null;
  auctionEndsAt: string | null;
  startingPrice: number | null;
  bidIncrement: number | null;
  depositAmount: number | null;
  buyNowPrice: number | null;
  isVerified: boolean;
  auctionRejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  sellerId: string;
  seller?: {
    id: string;
    name: string;
  };
}

export interface CartItem {
  id: string;
  cartId: string;
  batteryId: string;
  quantity: number;
  createdAt: string;
  battery: CartBattery;
}

export interface Cart {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
}

export interface CartResponse {
  message: string;
  data: Cart;
}

export interface AddToCartPayload {
  batteryId: string;
}

export interface AddToCartResponse {
  message: string;
  data: CartItem;
}

export interface CartCheckoutPayload {
  paymentMethod: 'MOMO' | 'WALLET';
  redirectUrl: string;
}

export interface CartCheckoutResponse {
  message: string;
  data: {
    paymentUrl: string;
    transaction: {
      id: string;
      buyerId: string;
      status: string;
      listingType: string;
      parentId: string | null;
      isDepositPaid: boolean;
      appointmentDeadline: string | null;
      confirmationDeadline: string | null;
      paymentDeadline: string | null;
      type: string;
      disputeReason: string | null;
      disputeImages: string[];
      vehicleId: string | null;
      batteryId: string | null;
      finalPrice: number;
      paymentGateway: string;
      paymentDetail: any;
      createdAt: string;
      updatedAt: string;
    };
  };
}
