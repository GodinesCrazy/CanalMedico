import prisma from '@/database/prisma';
import { hashPassword, comparePassword } from '@/utils/hash';
import { generateTokenPair, verifyRefreshToken } from '@/utils/jwt';

import { createError } from '@/middlewares/error.middleware';
import logger from '@/config/logger';
import { validateRut, formatRut } from '@/utils/rut';

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  role: string;
  age?: number;
  speciality?: string;
  rut?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export class AuthService {
  async register(data: RegisterDto) {
    try {
      // Verificar si el usuario ya existe
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        throw createError('El email ya está registrado', 409);
      }

      // Hash de la contraseña
      const hashedPassword = await hashPassword(data.password);

      // Crear usuario
      const user = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          role: data.role,
        },
      });

      // Crear perfil según el rol
      if (data.role === 'DOCTOR') {
        if (!data.rut) {
          throw createError('El RUT es obligatorio para médicos', 400);
        }

        if (!validateRut(data.rut)) {
          throw createError('El RUT ingresado no es válido', 400);
        }

        // Verificar si el RUT ya está registrado
        const existingDoctor = await prisma.doctor.findUnique({
          where: { rut: formatRut(data.rut) },
        });

        if (existingDoctor) {
          // Si falla aquí, deberíamos borrar el usuario creado para no dejar huérfanos
          await prisma.user.delete({ where: { id: user.id } });
          throw createError('El RUT ya está registrado', 409);
        }

        await prisma.doctor.create({
          data: {
            userId: user.id,
            name: data.name,
            rut: formatRut(data.rut),
            speciality: data.speciality || 'General',
            tarifaConsulta: 0,
            tarifaUrgencia: 0,
            estadoOnline: false,
          },
        });
      } else if (data.role === 'PATIENT') {
        await prisma.patient.create({
          data: {
            userId: user.id,
            name: data.name,
            age: data.age || null,
          },
        });
      }

      // Obtener usuario con perfil completo
      const userWithProfile = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          doctor: true,
          patient: true,
        },
      });

      // Generar tokens
      const tokens = generateTokenPair(user.id, user.email, user.role);

      logger.info(`Usuario registrado: ${user.email} (${user.role})`);

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          profile: userWithProfile?.doctor || userWithProfile?.patient,
        },
        ...tokens,
      };
    } catch (error) {
      logger.error('Error en registro:', error);
      throw error;
    }
  }

  async login(data: LoginDto) {
    try {
      // Buscar usuario
      const user = await prisma.user.findUnique({
        where: { email: data.email },
        include: {
          doctor: true,
          patient: true,
        },
      });

      if (!user) {
        throw createError('Email o contraseña incorrectos', 401);
      }

      // Verificar contraseña
      const isPasswordValid = await comparePassword(data.password, user.password);

      if (!isPasswordValid) {
        throw createError('Email o contraseña incorrectos', 401);
      }

      // Generar tokens
      const tokens = generateTokenPair(user.id, user.email, user.role);

      logger.info(`Usuario inició sesión: ${user.email} (${user.role})`);

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          profile: user.doctor || user.patient,
        },
        ...tokens,
      };
    } catch (error) {
      logger.error('Error en login:', error);
      throw error;
    }
  }

  async refreshToken(data: RefreshTokenDto) {
    try {
      // Verificar refresh token
      const decoded = verifyRefreshToken(data.refreshToken);

      // Buscar usuario
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        throw createError('Usuario no encontrado', 404);
      }

      // Generar nuevos tokens
      const tokens = generateTokenPair(user.id, user.email, user.role);

      return tokens;
    } catch (error) {
      logger.error('Error al refrescar token:', error);
      throw createError('Refresh token inválido o expirado', 401);
    }
  }
}

export default new AuthService();

