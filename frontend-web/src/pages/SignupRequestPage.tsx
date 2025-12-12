import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiMail, FiPhone, FiUser, FiBriefcase, FiFileText } from 'react-icons/fi';

export default function SignupRequestPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    rut: '',
    birthDate: '',
    specialty: '',
    registrationNumber: '',
    email: '',
    phone: '',
    clinicOrCenter: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post('/signup-requests', formData);

      if (response.success) {
        toast.success('Tu solicitud ha sido enviada. El administrador revisará tus datos y te contactará con las credenciales de acceso.');
        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar la solicitud. Por favor, intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <FiArrowLeft className="mr-2 h-5 w-5" />
              Volver al login
            </button>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <img
                  src="/assets/logo-full.png"
                  alt="CanalMedico"
                  className="h-16 w-auto object-contain"
                />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Solicitud de Registro Médico</h1>
              <p className="text-gray-600 mt-2">
                Completa el siguiente formulario para solicitar acceso a la plataforma
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre completo */}
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input pl-10"
                    placeholder="Dr. Juan Pérez"
                    required
                  />
                </div>
              </div>

              {/* RUT */}
              <div>
                <label htmlFor="rut" className="block text-sm font-medium text-gray-700 mb-2">
                  RUT <span className="text-red-500">*</span>
                </label>
                <input
                  id="rut"
                  type="text"
                  value={formData.rut}
                  onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                  className="input"
                  placeholder="12345678-9"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Formato: 12345678-9</p>
              </div>

              {/* Fecha de Nacimiento */}
              <div>
                <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Nacimiento
                </label>
                <input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="input"
                  max={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500 mt-1">Ayuda a validar tu identidad</p>
              </div>

              {/* Especialidad */}
              <div>
                <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-2">
                  Especialidad *
                </label>
                <input
                  id="specialty"
                  type="text"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="input"
                  placeholder="Medicina General"
                  required
                />
              </div>

              {/* Número de registro / colegiatura */}
              <div>
                <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Registro / Colegiatura
                </label>
                <input
                  id="registrationNumber"
                  type="text"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  className="input"
                  placeholder="Número de colegiatura"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input pl-10"
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input pl-10"
                    placeholder="+56 9 1234 5678"
                  />
                </div>
              </div>

              {/* Clínica / lugar donde atiende */}
              <div className="md:col-span-2">
                <label htmlFor="clinicOrCenter" className="block text-sm font-medium text-gray-700 mb-2">
                  Clínica / Lugar donde Atiende
                </label>
                <div className="relative">
                  <FiBriefcase className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                  <input
                    id="clinicOrCenter"
                    type="text"
                    value={formData.clinicOrCenter}
                    onChange={(e) => setFormData({ ...formData, clinicOrCenter: e.target.value })}
                    className="input pl-10"
                    placeholder="Nombre de la clínica o centro médico"
                  />
                </div>
              </div>

              {/* Comentarios adicionales */}
              <div className="md:col-span-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Comentarios Adicionales
                </label>
                <div className="relative">
                  <FiFileText className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input pl-10 pt-3"
                    rows={4}
                    placeholder="Información adicional que desees proporcionar..."
                  />
                </div>
              </div>
            </div>

            {/* Información sobre validación automática */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Validación Automática
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Tu identidad y tu habilitación profesional serán verificadas automáticamente con fuentes oficiales del Estado de Chile:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li><strong>Registro Civil:</strong> Validación de RUN y nombre</li>
                      <li><strong>Superintendencia de Salud (RNPI):</strong> Verificación de habilitación como médico</li>
                    </ul>
                    <p className="mt-2">
                      Si tus datos coinciden con los registros oficiales, tu solicitud será aprobada automáticamente. En caso de discrepancias menores, será revisada manualmente.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit button */}
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="btn btn-secondary"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary"
              >
                {isLoading ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

