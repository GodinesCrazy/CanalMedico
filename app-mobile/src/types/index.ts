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
  estadoOnlineCalculado?: boolean; // Disponibilidad calculada (manual o automático)
  modoDisponibilidad?: 'MANUAL' | 'AUTOMATICO';
  horariosAutomaticos?: string;
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
  prescriptions?: Prescription[];
}

export enum PrescriptionStatus {
  PENDIENTE_ENVIO_SNRE = 'PENDIENTE_ENVIO_SNRE',
  ENVIADA_SNRE = 'ENVIADA_SNRE',
  ERROR_SNRE = 'ERROR_SNRE',
  ANULADA_SNRE = 'ANULADA_SNRE',
}

export interface PrescriptionItem {
  id: string;
  prescriptionId: string;
  medicationName: string;
  tfcCode?: string;
  snomedCode?: string;
  presentation?: string;
  pharmaceuticalForm?: string;
  dosage: string;
  frequency: string;
  duration?: string;
  quantity?: string;
  instructions?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Prescription {
  id: string;
  consultationId: string;
  doctorId: string;
  patientId: string;
  status: PrescriptionStatus;
  snreId?: string;
  snreCode?: string;
  snreBundleId?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  sentToSnreAt?: string;
  prescriptionItems: PrescriptionItem[];
  consultation?: Consultation;
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

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Consultations: undefined;
  ConsultationDetail: { consultationId: string };
  Chat: { consultationId: string };
  Payment: { consultationId: string; amount: number };
  History: undefined;
  Profile: undefined;
  Scanner: undefined;
  DoctorSearch: undefined;
};

