import { useEffect, useState } from 'react';
import api from '@/services/api';
import { formatCLP } from '@/utils/currency';
import { FiDollarSign, FiTrendingUp, FiDownload, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';

type CommissionStats = {
    totalCommissions: number;
    monthlyCommissions: number;
    paymentsCount: number;
};

type DoctorCommission = {
    doctorId: string;
    doctorName: string;
    doctorEmail: string;
    totalCommissions: number;
    totalPayments: number;
    paymentsCount: number;
};

type MonthlyData = {
    month: string;
    totalCommissions: number;
    totalAmount: number;
    paymentsCount: number;
};

export default function CommissionsPage() {
    const [stats, setStats] = useState<CommissionStats>({
        totalCommissions: 0,
        monthlyCommissions: 0,
        paymentsCount: 0,
    });
    const [doctorCommissions, setDoctorCommissions] = useState<DoctorCommission[]>([]);
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);

            // Cargar estadísticas
            const statsResponse = await api.get('/commissions/stats');
            if (statsResponse.success && statsResponse.data) {
                setStats(statsResponse.data as any);
            }

            // Cargar comisiones por médico
            const doctorsResponse = await api.get('/commissions/by-doctor');
            if (doctorsResponse.success && doctorsResponse.data) {
                setDoctorCommissions((doctorsResponse.data as any) || []);
            }

            // Cargar datos mensuales
            const monthlyResponse = await api.get('/commissions/monthly');
            if (monthlyResponse.success && monthlyResponse.data) {
                setMonthlyData((monthlyResponse.data as any) || []);
            }
        } catch (error) {
            console.error('Error al cargar comisiones:', error);
            toast.error('Error al cargar datos de comisiones');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportCSV = () => {
        try {
            // Crear CSV
            const headers = ['Médico', 'Email', 'Total Comisiones', 'Total Pagos', 'Cantidad Consultas'];
            const rows = doctorCommissions.map(d => [
                d.doctorName,
                d.doctorEmail,
                d.totalCommissions,
                d.totalPayments,
                d.paymentsCount,
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.join(',')),
            ].join('\n');

            // Descargar
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `comisiones_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success('Reporte exportado exitosamente');
        } catch (error) {
            console.error('Error al exportar:', error);
            toast.error('Error al exportar reporte');
        }
    };

    const handleFilterByPeriod = async () => {
        if (!startDate || !endDate) {
            toast.error('Selecciona ambas fechas');
            return;
        }

        try {
            const response = await api.get(
                `/commissions/by-doctor?startDate=${startDate}&endDate=${endDate}`
            );
            if (response.success && response.data) {
                setDoctorCommissions((response.data as any) || []);
                toast.success('Filtro aplicado');
            }
        } catch (error) {
            console.error('Error al filtrar:', error);
            toast.error('Error al filtrar datos');
        }
    };

    const handleClearFilter = () => {
        setStartDate('');
        setEndDate('');
        loadData();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Cargando comisiones...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Panel de Comisiones</h1>
                <p className="text-gray-600 mt-2">Gestiona y visualiza las comisiones de la plataforma</p>
            </div>

            {/* Estadísticas Generales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Comisiones</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCLP(stats.totalCommissions)}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                            <FiDollarSign className="text-green-600 h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Comisiones del Mes</p>
                            <p className="text-2xl font-bold text-blue-600">{formatCLP(stats.monthlyCommissions)}</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                            <FiTrendingUp className="text-blue-600 h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Pagos</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.paymentsCount}</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                            <FiCalendar className="text-purple-600 h-6 w-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtros y Exportación */}
            <div className="card mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha Inicio
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="input"
                        />
                    </div>

                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha Fin
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="input"
                        />
                    </div>

                    <button
                        onClick={handleFilterByPeriod}
                        className="btn btn-primary"
                    >
                        Filtrar
                    </button>

                    <button
                        onClick={handleClearFilter}
                        className="btn btn-secondary"
                    >
                        Limpiar
                    </button>

                    <button
                        onClick={handleExportCSV}
                        className="btn btn-success flex items-center gap-2"
                    >
                        <FiDownload />
                        Exportar CSV
                    </button>
                </div>
            </div>

            {/* Comisiones por Médico */}
            <div className="card mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Comisiones por Médico</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Médico</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-700">Consultas</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-700">Total Pagos</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-700">Comisiones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {doctorCommissions.map((doctor) => (
                                <tr key={doctor.doctorId} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-4 font-medium">{doctor.doctorName}</td>
                                    <td className="py-3 px-4 text-sm text-gray-600">{doctor.doctorEmail}</td>
                                    <td className="py-3 px-4 text-right">{doctor.paymentsCount}</td>
                                    <td className="py-3 px-4 text-right font-medium">
                                        {formatCLP(doctor.totalPayments)}
                                    </td>
                                    <td className="py-3 px-4 text-right font-bold text-green-600">
                                        {formatCLP(doctor.totalCommissions)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-gray-300 font-bold">
                                <td className="py-3 px-4" colSpan={2}>TOTAL</td>
                                <td className="py-3 px-4 text-right">
                                    {doctorCommissions.reduce((sum, d) => sum + d.paymentsCount, 0)}
                                </td>
                                <td className="py-3 px-4 text-right">
                                    {formatCLP(doctorCommissions.reduce((sum, d) => sum + d.totalPayments, 0))}
                                </td>
                                <td className="py-3 px-4 text-right text-green-600">
                                    {formatCLP(doctorCommissions.reduce((sum, d) => sum + d.totalCommissions, 0))}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Gráfico de Comisiones Mensuales */}
            <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Comisiones Mensuales (Últimos 12 Meses)</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Mes</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-700">Consultas</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-700">Total Pagos</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-700">Comisiones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyData.map((month) => (
                                <tr key={month.month} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-4 font-medium">{month.month}</td>
                                    <td className="py-3 px-4 text-right">{month.paymentsCount}</td>
                                    <td className="py-3 px-4 text-right">{formatCLP(month.totalAmount)}</td>
                                    <td className="py-3 px-4 text-right font-bold text-green-600">
                                        {formatCLP(month.totalCommissions)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
