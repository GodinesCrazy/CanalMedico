import jwt from 'jsonwebtoken';
import env from '@/config/env';
import { JwtPayload, UserRole } from '@/types';
import crypto from 'crypto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export const generateTokenPair = (id: string, email: string, role: UserRole): TokenPair => {
  const payload: JwtPayload = {
    id,
    email,
    role,
  };

  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as string,
  } as jwt.SignOptions);

  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as string,
  } as jwt.SignOptions);

  return {
    accessToken,
    refreshToken,
  };
};

export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
  } catch (error) {
    throw new Error('Refresh token inválido o expirado');
  }
};

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch (error) {
    return null;
  }
};

// Hash SHA-256 seguro para almacenar tokens en blacklist
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Obtiene la fecha de expiración (Date) desde el token (exp en segundos)
export const getTokenExpiration = (token: string): Date | null => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return null;
  return new Date(decoded.exp * 1000);
};

