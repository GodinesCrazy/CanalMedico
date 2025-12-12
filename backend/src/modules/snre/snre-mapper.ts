/**
 * Mapper para convertir datos de CanalMedico a recursos FHIR seg�n la Gu�a de Implementaci�n SNRE
 * Basado en HL7 FHIR R4 y perfiles chilenos (Core-CL, SNRE)
 */

import { 
  PatientFhirData, 
  PractitionerFhirData, 
  PrescriptionMedication, 
  FhirRecetaBundle,
  RecetaType 
} from './snre.types';
import { formatRut } from '@/utils/rut';
import logger from '@/config/logger';

export class SnreMapper {
  /**
   * Crea un Bundle FHIR completo para una receta seg�n el perfil SNRE
   */
  createRecetaBundle(
    patient: PatientFhirData,
    practitioner: PractitionerFhirData,
    medications: PrescriptionMedication[],
    consultationId: string,
    recetaType: RecetaType = RecetaType.SIMPLE
  ): FhirRecetaBundle {
    const timestamp = new Date().toISOString();
    const bundleId = `bundle-${consultationId}-${Date.now()}`;

    // Crear recursos FHIR
    const patientResource = this.createPatientResource(patient);
    const practitionerResource = this.createPractitionerResource(practitioner);
    const organizationResource = this.createOrganizationResource(practitioner);
    const compositionResource = this.createCompositionResource(
      patient,
      practitioner,
      medications,
      consultationId,
      recetaType,
      timestamp
    );
    const medicationRequests = this.createMedicationRequestResources(
      medications,
      patient,
      practitioner,
      consultationId
    );

    // Construir Bundle
    const bundle: FhirRecetaBundle = {
      resourceType: 'Bundle',
      type: 'document',
      timestamp,
      entry: [
        {
          fullUrl: `urn:uuid:${this.generateUUID()}`,
          resource: compositionResource,
        },
        {
          fullUrl: `urn:uuid:${this.generateUUID()}`,
          resource: patientResource,
        },
        {
          fullUrl: `urn:uuid:${this.generateUUID()}`,
          resource: practitionerResource,
        },
        ...(organizationResource ? [{
          fullUrl: `urn:uuid:${this.generateUUID()}`,
          resource: organizationResource,
        }] : []),
        ...medicationRequests.map((mr, _index) => ({
          fullUrl: `urn:uuid:${this.generateUUID()}`,
          resource: mr,
        })),
      ],
    };

    logger.debug('Bundle FHIR creado', {
      bundleId,
      entries: bundle.entry.length,
      medications: medications.length,
    });

    return bundle;
  }

  /**
   * Crea un recurso Patient FHIR seg�n perfil Core-CL
   */
  private createPatientResource(patient: PatientFhirData): any {
    const rutFormatted = formatRut(patient.rut);

    return {
      resourceType: 'Patient',
      id: `patient-${rutFormatted}`,
      identifier: [
        {
          use: 'official',
          system: 'http://www.registrocivil.cl/RUT', // Sistema de identificaci�n chileno
          value: rutFormatted,
        },
      ],
      name: [
        {
          use: 'official',
          family: this.extractLastName(patient.name),
          given: this.extractGivenNames(patient.name),
        },
      ],
      ...(patient.birthDate && {
        birthDate: patient.birthDate,
      }),
      ...(patient.gender && {
        gender: patient.gender,
      }),
      ...(patient.address && {
        address: [
          {
            use: 'home',
            ...(patient.address.line && { line: patient.address.line }),
            ...(patient.address.city && { city: patient.address.city }),
            ...(patient.address.state && { state: patient.address.state }),
            ...(patient.address.postalCode && { postalCode: patient.address.postalCode }),
            country: patient.address.country || 'CL',
          },
        ],
      }),
    };
  }

  /**
   * Crea un recurso Practitioner FHIR seg�n perfil Core-CL
   */
  private createPractitionerResource(practitioner: PractitionerFhirData): any {
    const rutFormatted = formatRut(practitioner.rut);

    return {
      resourceType: 'Practitioner',
      id: `practitioner-${rutFormatted}`,
      identifier: [
        {
          use: 'official',
          system: 'http://www.registrocivil.cl/RUT',
          value: rutFormatted,
        },
        ...(practitioner.registrationNumber ? [{
          use: 'official',
          system: 'http://www.colegiomedico.cl/registro',
          value: practitioner.registrationNumber,
        }] : []),
      ],
      name: [
        {
          use: 'official',
          family: this.extractLastName(practitioner.name),
          given: this.extractGivenNames(practitioner.name),
        },
      ],
      qualification: [
        {
          code: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v2-0360',
                code: 'MD',
                display: 'M�dico',
              },
            ],
          },
          ...(practitioner.speciality && {
            extension: [
              {
                url: 'http://hl7.org/fhir/StructureDefinition/qualification-specialty',
                valueCodeableConcept: {
                  coding: [
                    {
                      system: 'http://snomed.info/sct',
                      code: this.mapSpecialityToSnomed(practitioner.speciality),
                      display: practitioner.speciality,
                    },
                  ],
                },
              },
            ],
          }),
        },
      ],
    };
  }

  /**
   * Crea un recurso Organization (establecimiento) si aplica
   */
  private createOrganizationResource(practitioner: PractitionerFhirData): any | null {
    if (!practitioner.organizationCode) {
      return null;
    }

    return {
      resourceType: 'Organization',
      id: `org-${practitioner.organizationCode}`,
      identifier: [
        {
          use: 'official',
          system: 'http://www.minsal.cl/establecimientos',
          value: practitioner.organizationCode,
        },
      ],
      name: 'CanalMedico', // O el nombre del establecimiento si lo tenemos
      type: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/organization-type',
              code: 'prov',
              display: 'Healthcare Provider',
            },
          ],
        },
      ],
    };
  }

  /**
   * Crea un recurso Composition (Receta) seg�n perfil RecetaPrescripcionCl
   */
  private createCompositionResource(
    patient: PatientFhirData,
    practitioner: PractitionerFhirData,
    medications: PrescriptionMedication[],
    consultationId: string,
    recetaType: RecetaType,
    timestamp: string
  ): any {
    return {
      resourceType: 'Composition',
      status: 'final',
      type: {
        coding: [
          {
            system: 'http://snomed.info/sct',
            code: '761938008', // SNOMED: Prescription record
            display: 'Receta M�dica',
          },
        ],
        text: 'Receta M�dica Electr�nica',
      },
      subject: {
        reference: `Patient/patient-${formatRut(patient.rut)}`,
      },
      author: [
        {
          reference: `Practitioner/practitioner-${formatRut(practitioner.rut)}`,
        },
      ],
      date: timestamp,
      title: 'Receta Electr�nica - CanalMedico',
      section: [
        {
          title: 'Prescripciones',
          code: {
            coding: [
              {
                system: 'http://snomed.info/sct',
                code: '182836005', // SNOMED: Prescription
                display: 'Prescripci�n',
              },
            ],
          },
          entry: medications.map((_, index) => ({
            reference: `MedicationRequest/medication-request-${consultationId}-${index}`,
          })),
        },
      ],
      extension: [
        {
          url: 'http://hl7.org/fhir/cl/snre/StructureDefinition/RecetaType',
          valueCode: recetaType,
        },
      ],
    };
  }

  /**
   * Crea recursos MedicationRequest para cada medicamento
   */
  private createMedicationRequestResources(
    medications: PrescriptionMedication[],
    patient: PatientFhirData,
    practitioner: PractitionerFhirData,
    consultationId: string
  ): any[] {
    return medications.map((medication, index) => ({
      resourceType: 'MedicationRequest',
      id: `medication-request-${consultationId}-${index}`,
      status: 'active',
      intent: 'order',
      medicationCodeableConcept: {
        coding: [
          ...(medication.tfcCode ? [{
            system: 'http://www.minsal.cl/TFC',
            code: medication.tfcCode,
            display: medication.medicationName,
          }] : []),
          ...(medication.snomedCode ? [{
            system: 'http://snomed.info/sct',
            code: medication.snomedCode,
            display: medication.medicationName,
          }] : []),
          {
            system: 'http://www.minsal.cl/medicamentos',
            code: medication.medicationName.toLowerCase().replace(/\s+/g, '-'),
            display: medication.medicationName,
          },
        ],
        text: medication.medicationName,
      },
      subject: {
        reference: `Patient/patient-${formatRut(patient.rut)}`,
      },
      requester: {
        reference: `Practitioner/practitioner-${formatRut(practitioner.rut)}`,
      },
      dosageInstruction: [
        {
          text: `${medication.dosage} ${medication.frequency}${medication.duration ? ` por ${medication.duration}` : ''}`,
          timing: {
            repeat: {
              frequency: this.parseFrequency(medication.frequency),
              period: this.parsePeriod(medication.frequency),
              periodUnit: 'h', // horas
            },
          },
          doseAndRate: [
            {
              doseQuantity: {
                value: this.parseDosage(medication.dosage),
                unit: medication.presentation || 'unidad',
              },
            },
          ],
          ...(medication.instructions && {
            patientInstruction: medication.instructions,
          }),
        },
      ],
      ...(medication.quantity && {
        dispenseRequest: {
          quantity: {
            value: this.parseQuantity(medication.quantity),
            unit: medication.presentation || 'unidad',
          },
        },
      }),
    }));
  }

  /**
   * Utilidades para parsear datos
   */
  private extractLastName(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    return parts.length > 1 ? parts.slice(-1)[0] : '';
  }

  private extractGivenNames(fullName: string): string[] {
    const parts = fullName.trim().split(/\s+/);
    return parts.length > 1 ? parts.slice(0, -1) : parts;
  }

  private mapSpecialityToSnomed(speciality: string): string {
    // Mapeo b�sico de especialidades comunes a c�digos SNOMED
    const specialityMap: Record<string, string> = {
      'Medicina General': '419192003',
      'Pediatr�a': '419610006',
      'Cardiolog�a': '419040004',
      'Dermatolog�a': '419043002',
      'Neurolog�a': '419039003',
      'Psiquiatr�a': '419192003',
    };

    return specialityMap[speciality] || '419192003'; // Default: Medicina General
  }

  private parseFrequency(frequency: string): number {
    // Parsear frecuencia como "cada 8 horas" -> 3 veces al d�a
    const match = frequency.match(/cada\s+(\d+)/i);
    if (match) {
      const hours = parseInt(match[1], 10);
      return 24 / hours; // Veces por d�a
    }
    return 1; // Default
  }

  private parsePeriod(frequency: string): number {
    // Parsear per�odo en horas
    const match = frequency.match(/cada\s+(\d+)/i);
    if (match) {
      return parseInt(match[1], 10);
    }
    return 24; // Default: cada 24 horas
  }

  private parseDosage(dosage: string): number {
    // Extraer n�mero de la dosis (ej: "1 tableta" -> 1)
    const match = dosage.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 1;
  }

  private parseQuantity(quantity: string): number {
    // Extraer cantidad total
    const match = quantity.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  }

  private generateUUID(): string {
    // Generar UUID simple para recursos FHIR
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

export default new SnreMapper();

