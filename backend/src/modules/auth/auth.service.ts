import prisma from '@/database/prisma';
import { hashPassword, comparePassword } from '@/utils/hash';
import { generateTokenPair, verifyRefreshToken, hashToken, getTokenExpiration, decodeToken } from '@/utils/jwt';

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

// OTP Service se carga dinámicamente (ver loadOtpService)
// NO importar estáticamente para evitar errores de build

export class AuthService {
  /**
   * Obtener instancia del servicio OTP (carga dinámica)
   * 
   * @private
   */
  private getOtpService() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { loadOtpService } = require('./loadOtpService');
    return loadOtpService();
  }

  /**
   * Enviar OTP por WhatsApp o SMS
   * 
   * FASE 3: Login invisible
   * 
   * Solo funciona si ENABLE_PHONE_LOGIN=true y el servicio está disponible
   */
  async sendOTP(data: { phoneNumber: string; attemptId?: string; method?: 'WHATSAPP' | 'SMS' }) {
    const otpService = this.getOtpService();
    if (!otpService) {
      throw createError('Servicio OTP no disponible. Feature no habilitado o módulo no cargado.', 503);
    }
    return otpService.sendOTP(data);
  }

  /**
   * Verificar OTP y crear/iniciar sesión automáticamente
   * 
   * FASE 3: Login invisible
   * 
   * Solo funciona si ENABLE_PHONE_LOGIN=true y el servicio está disponible
   */
  async verifyOTP(data: { phoneNumber: string; otp: string; attemptId?: string }) {
    const otpService = this.getOtpService();
    if (!otpService) {
      throw createError('Servicio OTP no disponible. Feature no habilitado o módulo no cargado.', 503);
    }
    return otpService.verifyOTP(data);
  }

  async register(data: RegisterDto) {
    try {
      // Verificar si el usuario ya existe (solo email, sin phoneNumber)
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
        select: {
          id: true,
          email: true,
          // NO incluir phoneNumber - solo se usa en OTP (módulo separado)
        },
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
          where: { rut: formatRut(data.rut) } as any,
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
          } as any,
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

      // Obtener usuario con perfil completo (sin phoneNumber)
      const userWithProfile = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          role: true,
          doctor: true,
          patient: true,
          // NO incluir phoneNumber - solo se usa en OTP (módulo separado)
        },
      });

      // Generar tokens
      const tokens = generateTokenPair(user.id, user.email, user.role as any);

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
      // Buscar usuario con SELECT explícito para evitar errores Prisma P2022
      // NO incluir phoneNumber ni otros campos opcionales que pueden no existir en la BD
      // Solo campos esenciales: id, email, password, role
      const user = await prisma.user.findUnique({
        where: { email: data.email },
        select: {
          id: true,
          email: true,
          password: true,
          role: true,
          // NO incluir phoneNumber - solo se usa en OTP (módulo separado)
          // NO incluir createdAt ni otras relaciones aquí
        },
      });

      if (!user) {
        throw createError('Email o contraseña incorrectos', 401);
      }

      // INCIDENT FIX: Guard defensivo - evita bcrypt.compare() con hash null/inválido (→ 500)
      if (!user.password || typeof user.password !== 'string') {
        throw createError('Email o contraseña incorrectos', 401);
      }

      // Verificar contraseña (wrap para evitar 500 si bcrypt lanza por hash inválido)
      let isPasswordValid = false;
      try {
        isPasswordValid = await comparePassword(data.password, user.password);
      } catch (compareErr) {
        logger.warn('Error en comparePassword (hash inválido o corrupto):', compareErr);
        throw createError('Email o contraseña incorrectos', 401);
      }

      if (!isPasswordValid) {
        throw createError('Email o contraseña incorrectos', 401);
      }

      // Cargar relaciones SOLO si es necesario (ADMIN no necesita doctor ni patient)
      let profile = null;
      if (user.role === 'DOCTOR') {
        // Solo cargar doctor si el usuario es DOCTOR
        try {
          const doctor = await prisma.doctor.findUnique({
            where: { userId: user.id },
            // NO usar select aquí para evitar problemas, pero capturar errores
          });
          profile = doctor;
        } catch (error) {
          // Si falla al cargar doctor, continuar sin profile (evita errores Prisma)
          logger.warn(`No se pudo cargar doctor para usuario ${user.id}:`, error);
        }
      } else if (user.role === 'PATIENT') {
        // Cargar patient si es necesario
        try {
          const patient = await prisma.patient.findUnique({
            where: { userId: user.id },
            // NO usar select aquí para evitar problemas, pero capturar errores
          });
          profile = patient;
        } catch (error) {
          logger.warn(`No se pudo cargar patient para usuario ${user.id}:`, error);
        }
      }
      // ADMIN no tiene profile (no necesita cargar relaciones ni phoneNumber)

      // Generar tokens
      const tokens = generateTokenPair(user.id, user.email, user.role as any);

      logger.info(`Usuario inició sesión: ${user.email} (${user.role})`);

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          profile: profile,
        },
        ...tokens,
      };
    } catch (error: any) {
      // INCIDENT FIX: Errores operacionales (createError) se reenvían con su statusCode.
      // Cualquier otro error se convierte en 401 para no devolver 500.
      if (error?.isOperational === true && typeof error?.statusCode === 'number') {
        throw error;
      }
      logger.error('Error en login:', error);
      throw createError('Email o contraseña incorrectos', 401);
    }
  }

  async refreshToken(data: RefreshTokenDto) {
    try {
      // Verificar refresh token
      const decoded = verifyRefreshToken(data.refreshToken);

      // Buscar usuario con SELECT explícito para evitar errores Prisma P2022
      // NO incluir phoneNumber ni otros campos opcionales
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          role: true,
          // NO incluir phoneNumber - solo se usa en OTP (módulo separado)
        },
      });

      if (!user) {
        throw createError('Usuario no encontrado', 404);
      }

      // Generar nuevos tokens
      const tokens = generateTokenPair(user.id, user.email, user.role as any);

      return tokens;
    } catch (error) {
      logger.error('Error al refrescar token:', error);
      throw createError('Refresh token inválido o expirado', 401);
    }
  }

  /**
   * Logout: invalida el access token añadiéndolo a la blacklist
   * INCIDENT FIX: Si la tabla token_blacklist no existe en producción (migración pendiente),
   * devolvemos success para no romper el flujo; el token sigue expirando por JWT.
   */
  async logout(accessToken: string) {
    try {
      const decoded = decodeToken(accessToken);
      const tokenHash = hashToken(accessToken);
      const exp = getTokenExpiration(accessToken) || new Date(Date.now() + 15 * 60 * 1000);

      await prisma.tokenBlacklist.upsert({
        where: { token: tokenHash },
        update: { expiresAt: exp },
        create: {
          token: tokenHash,
          userId: decoded?.id || null,
          reason: 'LOGOUT',
          expiresAt: exp,
        },
      });

      return { success: true };
    } catch (error: any) {
      // INCIDENT FIX: tabla token_blacklist inexistente en producción → degradación controlada
      const code = error?.code as string | undefined;
      const msg = String(error?.message ?? '');
      const isTableMissing =
        code === 'P1014' || code === 'P2021' || msg.includes('does not exist') || msg.includes('relation "token_blacklist"');

      if (isTableMissing) {
        logger.warn('Logout: tabla token_blacklist no existe, devolviendo success (token expira por JWT)');
        return { success: true };
      }
      logger.error('Error en logout:', error);
      throw error;
    }
  }
}

export default new AuthService();

