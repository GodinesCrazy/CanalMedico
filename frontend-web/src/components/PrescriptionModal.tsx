/**
 * Modal para crear recetas electr�nicas SNRE
 */

import { useState } from 'react';
import { FiX, FiPlus, FiTrash2 } from 'react-icons/fi';
import api from '@/services/api';
import toast from 'react-hot-toast';

interface Medication {
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
}

interface PrescriptionModalProps {
  consultationId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PrescriptionModal({
  consultationId,
  isOpen,
  onClose,
  onSuccess,
}: PrescriptionModalProps) {
  const [medications, setMedications] = useState<Medication[]>([
    {
      medicationName: '',
      dosage: '',
      frequency: '',
    },
  ]);
  const [recetaType, setRecetaType] = useState<'simple' | 'retenida'>('simple');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const addMedication = () => {
    setMedications([
      ...medications,
      {
        medicationName: '',
        dosage: '',
        frequency: '',
      },
    ]);
  };

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que todos los medicamentos tienen datos m�nimos
    const invalid = medications.some(
      (med) => !med.medicationName.trim() || !med.dosage.trim() || !med.frequency.trim()
    );

    if (invalid) {
      toast.error('Por favor complete todos los campos obligatorios de cada medicamento');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post('/prescriptions', {
        consultationId,
        medications: medications.map((med) => ({
          ...med,
          medicationName: med.medicationName.trim(),
          dosage: med.dosage.trim(),
          frequency: med.frequency.trim(),
        })),
        recetaType,
        notes: notes.trim() || undefined,
      });

      if (response.success) {
        toast.success('Receta electr�nica creada exitosamente');
        onSuccess();
        onClose();
        // Reset form
        setMedications([
          {
            medicationName: '',
            dosage: '',
            frequency: '',
          },
        ]);
        setNotes('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al crear receta electr�nica');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Emitir Receta Electr�nica (SNRE)</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Tipo de receta */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Receta
            </label>
            <select
              value={recetaType}
              onChange={(e) => setRecetaType(e.target.value as 'simple' | 'retenida')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="simple">Receta Simple</option>
              <option value="retenida">Receta Retenida</option>
            </select>
          </div>

          {/* Medicamentos */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Medicamentos
              </label>
              <button
                type="button"
                onClick={addMedication}
                className="btn btn-primary flex items-center text-sm"
              >
                <FiPlus className="mr-1 h-4 w-4" />
                Agregar Medicamento
              </button>
            </div>

            <div className="space-y-4">
              {medications.map((med, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Medicamento {index + 1}
                    </h3>
                    {medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedication(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FiTrash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nombre del medicamento */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del Medicamento <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={med.medicationName}
                        onChange={(e) =>
                          updateMedication(index, 'medicationName', e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>

                    {/* C�digo TFC */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        C�digo TFC (opcional)
                      </label>
                      <input
                        type="text"
                        value={med.tfcCode || ''}
                        onChange={(e) => updateMedication(index, 'tfcCode', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Ej: TFC-12345"
                      />
                    </div>

                    {/* Presentaci�n */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Presentaci�n (opcional)
                      </label>
                      <input
                        type="text"
                        value={med.presentation || ''}
                        onChange={(e) => updateMedication(index, 'presentation', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Ej: Tabletas 500mg"
                      />
                    </div>

                    {/* Dosis */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dosis <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Ej: 1 tableta"
                        required
                      />
                    </div>

                    {/* Frecuencia */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frecuencia <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={med.frequency}
                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Ej: cada 8 horas"
                        required
                      />
                    </div>

                    {/* Duraci�n */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duraci�n (opcional)
                      </label>
                      <input
                        type="text"
                        value={med.duration || ''}
                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Ej: 7 d�as"
                      />
                    </div>

                    {/* Cantidad */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cantidad Total (opcional)
                      </label>
                      <input
                        type="text"
                        value={med.quantity || ''}
                        onChange={(e) => updateMedication(index, 'quantity', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Ej: 21 tabletas"
                      />
                    </div>

                    {/* Instrucciones */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Instrucciones Adicionales (opcional)
                      </label>
                      <textarea
                        value={med.instructions || ''}
                        onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        rows={2}
                        placeholder="Ej: Tomar con alimentos"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notas adicionales */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas Adicionales (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={3}
              placeholder="Notas adicionales sobre la receta..."
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Emitir Receta Electr�nica'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
