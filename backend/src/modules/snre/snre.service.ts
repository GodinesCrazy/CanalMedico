/**
 * Servicio de negocio para recetas SNRE
 * Orquesta la creaci�n de recetas, mapeo a FHIR y comunicaci�n con SNRE
 */

import prisma from '@/database/prisma';
import { createError } from '@/middlewares/error.middleware';
import logger from '@/config/logger';
import snreClient from './snre-client';
import snreMapper from './snre-mapper';
import { 
  CreatePrescriptionDto, 
  PrescriptionStatus,
  PatientFhirData,
  PractitionerFhirData,
} from './snre.types';
// formatRut not used

export class SnreService {
  /**
   * Crea una receta electr�nica y la env�a al SNRE
   */
  async createPrescription(
    data: CreatePrescriptionDto,
    doctorId: string
  ) {
    try {
      // 1. Validar que la consulta existe y pertenece al m�dico
      const consultation = await prisma.consultation.findUnique({
        where: { id: data.consultationId },
        include: {
          doctor: {
            include: {
              user: true,
            },
          },
          patient: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!consultation) {
        throw createError('Consulta no encontrada', 404);
      }

      // Validar propiedad
      if (consultation.doctorId !== doctorId) {
        throw createError('No tienes permiso para emitir recetas en esta consulta', 403);
      }

      // Validar que la consulta est� activa o cerrada
      if (consultation.status !== 'ACTIVE' && consultation.status !== 'CLOSED') {
        throw createError('Solo se pueden emitir recetas en consultas activas o cerradas', 400);
      }

      // 2. Validar que el m�dico tiene RUT (obligatorio para SNRE)
      if (!consultation.doctor.rut) {
        throw createError('El m�dico debe tener RUT registrado para emitir recetas SNRE', 400);
      }

      // 3. Validar que el paciente tiene RUT (obligatorio para SNRE)
      if (!consultation.patient.rut) {
        throw createError('El paciente debe tener RUT registrado para emitir recetas SNRE', 400);
      }

      // 4. Preparar datos para FHIR
      const patientFhir: PatientFhirData = {
        rut: consultation.patient.rut,
        name: consultation.patient.name,
        birthDate: consultation.patient.birthDate 
          ? consultation.patient.birthDate.toISOString().split('T')[0]
          : (consultation.patient.age 
              ? this.calculateBirthDate(consultation.patient.age)
              : undefined),
        gender: consultation.patient.gender as any,
        address: consultation.patient.address 
          ? this.parseAddress(consultation.patient.address)
          : undefined,
      };

      const practitionerFhir: PractitionerFhirData = {
        rut: consultation.doctor.rut,
        name: consultation.doctor.name,
        speciality: consultation.doctor.speciality,
        registrationNumber: undefined, // TODO: Agregar al modelo Doctor si est� disponible
      };

      // 5. Crear Bundle FHIR
      const fhirBundle = snreMapper.createRecetaBundle(
        patientFhir,
        practitionerFhir,
        data.medications,
        data.consultationId,
        data.recetaType
      );

      // 6. Crear registro de receta en BD (estado PENDIENTE_ENVIO_SNRE)
      const prescription = await prisma.prescription.create({
        data: {
          consultationId: data.consultationId,
          doctorId: consultation.doctorId,
          patientId: consultation.patientId,
          status: PrescriptionStatus.PENDIENTE_ENVIO_SNRE,
          fhirBundle: JSON.stringify(fhirBundle),
          prescriptionItems: {
            create: data.medications.map((med, index) => ({
              medicationName: med.medicationName,
              tfcCode: med.tfcCode || null,
              snomedCode: med.snomedCode || null,
              presentation: med.presentation || null,
              pharmaceuticalForm: med.pharmaceuticalForm || null,
              dosage: med.dosage,
              frequency: med.frequency,
              duration: med.duration || null,
              quantity: med.quantity || null,
              instructions: med.instructions || null,
              order: index,
            })),
          },
        },
        include: {
          prescriptionItems: true,
        },
      });

      logger.info(`Receta creada localmente: ${prescription.id}`);

      // 7. Enviar al SNRE
      try {
        const snreResponse = await snreClient.createReceta(fhirBundle);

        if (snreResponse.success) {
          // Actualizar receta con datos del SNRE
          await prisma.prescription.update({
            where: { id: prescription.id },
            data: {
              status: PrescriptionStatus.ENVIADA_SNRE,
              snreId: snreResponse.snreId || null,
              snreCode: snreResponse.snreCode || null,
              snreBundleId: snreResponse.bundleId || null,
              sentToSnreAt: new Date(),
            },
          });

          logger.info(`Receta enviada exitosamente al SNRE: ${prescription.id}`, {
            snreId: snreResponse.snreId,
            snreCode: snreResponse.snreCode,
          });

          return {
            ...prescription,
            status: PrescriptionStatus.ENVIADA_SNRE,
            snreId: snreResponse.snreId,
            snreCode: snreResponse.snreCode,
            snreBundleId: snreResponse.bundleId,
          };
        } else {
          // Error al enviar al SNRE
          const errorMessage = snreResponse.errors?.[0]?.message || 'Error desconocido al enviar al SNRE';
          
          await prisma.prescription.update({
            where: { id: prescription.id },
            data: {
              status: PrescriptionStatus.ERROR_SNRE,
              errorMessage,
              errorDetails: JSON.stringify(snreResponse.errors),
            },
          });

          logger.error(`Error al enviar receta al SNRE: ${prescription.id}`, {
            errors: snreResponse.errors,
          });

          throw createError(errorMessage, 400);
        }
      } catch (snreError: any) {
        // Error de red o del cliente SNRE
        const errorMessage = snreError.message || 'Error al comunicarse con SNRE';
        
        await prisma.prescription.update({
          where: { id: prescription.id },
          data: {
            status: PrescriptionStatus.ERROR_SNRE,
            errorMessage,
            errorDetails: JSON.stringify(snreError),
          },
        });

        logger.error(`Error de comunicaci�n con SNRE: ${prescription.id}`, snreError);
        throw createError(errorMessage, 500);
      }
    } catch (error: any) {
      logger.error('Error al crear receta:', error);
      throw error;
    }
  }

  /**
   * Obtiene una receta por ID
   */
  async getPrescriptionById(prescriptionId: string, userId: string, userRole: string) {
    try {
      const prescription = await prisma.prescription.findUnique({
        where: { id: prescriptionId },
        include: {
          consultation: {
            include: {
              doctor: {
                include: {
                  user: true,
                },
              },
              patient: {
                include: {
                  user: true,
                },
              },
            },
          },
          prescriptionItems: {
            orderBy: {
              order: 'asc',
            },
          },
        },
      });

      if (!prescription) {
        throw createError('Receta no encontrada', 404);
      }

      // Validar propiedad
      if (userRole === 'DOCTOR' && prescription.doctorId !== userId) {
        throw createError('No tienes permiso para ver esta receta', 403);
      }

      if (userRole === 'PATIENT' && prescription.patientId !== userId) {
        throw createError('No tienes permiso para ver esta receta', 403);
      }

      return prescription;
    } catch (error: any) {
      logger.error('Error al obtener receta:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las recetas de una consulta
   */
  async getPrescriptionsByConsultation(consultationId: string, userId: string, userRole: string) {
    try {
      // Validar que el usuario tiene acceso a la consulta
      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
      });

      if (!consultation) {
        throw createError('Consulta no encontrada', 404);
      }

      if (userRole === 'DOCTOR' && consultation.doctorId !== userId) {
        throw createError('No tienes permiso para ver recetas de esta consulta', 403);
      }

      if (userRole === 'PATIENT' && consultation.patientId !== userId) {
        throw createError('No tienes permiso para ver recetas de esta consulta', 403);
      }

      const prescriptions = await prisma.prescription.findMany({
        where: { consultationId },
        include: {
          prescriptionItems: {
            orderBy: {
              order: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return prescriptions;
    } catch (error: any) {
      logger.error('Error al obtener recetas de consulta:', error);
      throw error;
    }
  }

  /**
   * Parsea una direccion de texto a objeto estructurado
   */
  private parseAddress(address: string): { line: string[]; city?: string; country: string } {
    return {
      line: [address],
      city: undefined,
      country: 'CL',
    };
  }

  /**
   * Calcula fecha de nacimiento aproximada a partir de la edad
   */
  private calculateBirthDate(age: number): string {
    const today = new Date();
    const birthYear = today.getFullYear() - age;
    return `${birthYear}-01-01`; // Aproximaci�n: 1 de enero del a�o calculado
  }
}

export default new SnreService();


