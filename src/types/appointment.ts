// Appointment types for scheduling meetings between buyer and seller

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface AppointmentUser {
  id: string;
  name: string;
  avatar: string | null;
}

export interface AppointmentVehicle {
  title: string;
  images: string[];
}

export interface AppointmentBattery {
  name: string;
  images: string[];
}

export interface AppointmentTransaction {
  id: string;
  status: string;
  vehicle?: AppointmentVehicle;
  battery?: AppointmentBattery;
}

export interface Appointment {
  id: string;
  transactionId: string;
  buyerId: string;
  sellerId: string;
  buyerProposedDates: string[];
  sellerProposedDates: string[];
  confirmedDate: string | null;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
  vehicleId: string | null;
  batteryId: string | null;
  transaction?: AppointmentTransaction;
  buyer?: AppointmentUser;
  seller?: AppointmentUser;
}

export interface AppointmentsResponse {
  message: string;
  data: {
    appointments: Appointment[];
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
  };
}

export interface AppointmentResponse {
  message: string;
  data: Appointment;
}

export interface ProposeDatePayload {
  proposedDates: string[]; // ISO 8601 format with timezone
}

export interface ConfirmDatePayload {
  confirmedDate: string; // ISO 8601 format with timezone
}
