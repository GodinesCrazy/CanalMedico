import jwt from 'jsonwebtoken';
import env from '@/config/env';
import { JwtPayload, UserRole } from '@/types';

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
    expiresIn: env.JWT_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });

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

