export enum UserRole {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  PATIENT = 'PATIENT',
}

export enum ConsultationType {
  NORMAL = 'NORMAL',
  URGENCIA = 'URGENCIA',
}

export enum ConsultationStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  profile?: Doctor | Patient;
}

export interface Doctor {
  id: string;
  userId: string;
  name: string;
  speciality: string;
  horarios?: any;
  tarifaConsulta: number;
  tarifaUrgencia: number;
  estadoOnline: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  userId: string;
  name: string;
  age?: number;
  medicalHistory?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Consultation {
  id: string;
  doctorId: string;
  patientId: string;
  type: ConsultationType;
  status: ConsultationStatus;
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  doctor?: Doctor;
  patient?: Patient;
  payment?: Payment;
  messages?: Message[];
}

export interface Message {
  id: string;
  consultationId: string;
  senderId: string;
  text?: string;
  fileUrl?: string;
  audioUrl?: string;
  pdfUrl?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: PaymentStatus;
  stripeSessionId?: string;
  stripePaymentId?: string;
  consultationId?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  age?: number;
  speciality?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

