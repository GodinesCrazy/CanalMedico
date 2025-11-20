import { Request } from 'express';
import { Socket } from 'socket.io';
import { UserRole, ConsultationType, ConsultationStatus, PaymentStatus } from '@prisma/client';

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

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  userId: string;
}

export {
  UserRole,
  ConsultationType,
  ConsultationStatus,
  PaymentStatus,
};
