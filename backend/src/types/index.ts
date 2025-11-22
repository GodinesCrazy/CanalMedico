import { Request } from 'express';
import { Socket } from 'socket.io';

// Tipos de enum como constantes (SQLite no soporta enums nativos)
export const UserRole = {
  ADMIN: 'ADMIN',
  DOCTOR: 'DOCTOR',
  PATIENT: 'PATIENT',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export const ConsultationType = {
  NORMAL: 'NORMAL',
  URGENCIA: 'URGENCIA',
} as const;

export type ConsultationType = typeof ConsultationType[keyof typeof ConsultationType];

export const ConsultationStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED',
} as const;

export type ConsultationStatus = typeof ConsultationStatus[keyof typeof ConsultationStatus];

export const PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
} as const;

export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

export const PayoutMode = {
  IMMEDIATE: 'IMMEDIATE',
  MONTHLY: 'MONTHLY',
} as const;

export type PayoutMode = typeof PayoutMode[keyof typeof PayoutMode];

export const PayoutStatus = {
  PENDING: 'PENDING',
  SCHEDULED: 'SCHEDULED',
  PAID_OUT: 'PAID_OUT',
} as const;

export type PayoutStatus = typeof PayoutStatus[keyof typeof PayoutStatus];

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export interface AuthenticatedSocket extends Socket {
  user?: AuthUser;
}

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  skip?: number;
  take?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface S3UploadResult {
  url: string;
  key: string;
  bucket: string;
}

export interface MercadoPagoWebhookEvent {
  id: string;
  type: string;
  data: {
    id: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  userId: string;
}
