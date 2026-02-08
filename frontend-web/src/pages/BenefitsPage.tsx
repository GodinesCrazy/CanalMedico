import { FiCheckCircle, FiClock, FiZap, FiShield, FiMessageSquare, FiExternalLink } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function BenefitsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Beneficios de CanalMedico</h1>
        <p className="text-gray-600 mt-2">Por qué el modelo asíncrono es mejor para médicos y pacientes.</p>
      </header>

      <section className="grid md:grid-cols-2 gap-6 mb-10">
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FiCheckCircle className="text-green-600 mr-2" /> Ventajas para el Médico
          </h2>
          <ul className="space-y-2 text-gray-700">
            <li>• Cobro automático sin fricción (deep link a pago; activación por pago aprobado).</li>
            <li>• Menos interrupciones: responde en sus ventanas; disponibilidad manual o automática.</li>
            <li>• Recetas electrónicas SNRE válidas y trazables.</li>
            <li>• Validación profesional (identidad + RNPI) y panel de ingresos/comisiones.</li>
          </ul>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FiCheckCircle className="text-blue-600 mr-2" /> Ventajas para el Paciente
          </h2>
          <ul className="space-y-2 text-gray-700">
            <li>• Acceso familiar: entra desde WhatsApp; login por OTP (sin contraseñas).</li>
            <li>• Rapidez y claridad: link a pago, confirmación y chat inmediato al aprobarse.</li>
            <li>• Chat con texto, imágenes, audio y PDFs; historial y notificaciones.</li>
            <li>• Confianza: médico verificado; recetas válidas en farmacias (SNRE).</li>
          </ul>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow p-6 border border-gray-100 mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <FiClock className="text-primary-600 mr-2" /> ¿Qué significa asíncrona?
        </h2>
        <p className="text-gray-700 mb-3">
          La atención no exige simultaneidad: el paciente inicia la consulta cuando quiere y el médico responde cuando está disponible. Si coinciden, el chat fluye en tiempo real; si no, cada parte responde en momentos distintos.
        </p>
        <div className="grid md:grid-cols-3 gap-4 mt-4">
          <div className="p-4 rounded-lg bg-primary-50 border border-primary-100">
            <p className="text-sm text-primary-800">Menos fricción que una videollamada</p>
          </div>
          <div className="p-4 rounded-lg bg-green-50 border border-green-100">
            <p className="text-sm text-green-800">Más consultas cerradas y trazabilidad</p>
          </div>
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
            <p className="text-sm text-blue-800">Registro, archivos y recetas en un solo lugar</p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow p-6 border border-gray-100 mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <FiMessageSquare className="text-gray-700 mr-2" /> Cómo funciona (resumen)
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>WhatsApp → auto‑respuesta con link a CanalMedico.</li>
          <li>OTP “invisible” → acceso sin contraseñas.</li>
          <li>Pago en MercadoPago → la consulta pasa a ACTIVE.</li>
          <li>Chat con archivos; receta electrónica SNRE si procede.</li>
          <li>Cierre y liquidación al médico (inmediata/mensual).</li>
        </ol>
        <div className="mt-4">
          <Link to="/settings" className="inline-flex items-center text-primary-700 hover:text-primary-900 font-medium">
            Configurar disponibilidad y tarifas <FiExternalLink className="ml-2" />
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-6 mb-10">
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FiShield className="text-emerald-600 mr-2" /> Seguridad y cumplimiento
          </h2>
          <ul className="space-y-2 text-gray-700">
            <li>• Autenticación JWT + blacklist, rate limiting, CORS y validación de datos.</li>
            <li>• Propiedad estricta de recursos (prevención de IDOR) y logs.</li>
            <li>• Integraciones oficiales: SNRE (HL7 FHIR), Floid (Registro Civil) y RNPI.</li>
          </ul>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FiZap className="text-yellow-600 mr-2" /> Diferenciadores clave
          </h2>
          <ul className="space-y-2 text-gray-700">
            <li>• No invasiva: integra hábitos reales (WhatsApp) y canaliza al flujo pagado.</li>
            <li>• Onboarding con fricción mínima (OTP + deep links) y mayor conversión.</li>
            <li>• Operación robusta: health checks, fallback de WhatsApp, jobs de payout, S3 y notificaciones.</li>
          </ul>
        </div>
      </section>

      <footer className="text-sm text-gray-500">
        Más detalles en la documentación: docs/ASINCRONO.md
      </footer>
    </div>
  );
}
