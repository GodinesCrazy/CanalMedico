/**
 * Formatea un número a formato de moneda chilena (CLP)
 * @param amount - Monto en pesos chilenos
 * @returns String formateado (ej: "$15.000")
 */
export function formatCLP(amount: number | string): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) return '$0';

    // React Native no siempre tiene Intl.NumberFormat, usar formateo manual
    const formatted = Math.round(numAmount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `$${formatted}`;
}

/**
 * Parsea un string de moneda CLP a número
 * @param clpString - String con formato CLP (ej: "$15.000")
 * @returns Número sin formato
 */
export function parseCLP(clpString: string): number {
    const cleaned = clpString.replace(/[^0-9]/g, '');
    return parseInt(cleaned) || 0;
}
