/**
 * Valida un RUT chileno
 * @param rut - RUT a validar (con o sin formato)
 * @returns true si el RUT es válido
 */
export function validateRut(rut: string): boolean {
    if (!rut || typeof rut !== 'string') return false;

    // Limpiar RUT
    const cleanRut = rut.replace(/[^0-9kK]/g, '');

    if (cleanRut.length < 2) return false;

    const body = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1).toUpperCase();

    // Validar cuerpo numérico
    if (!/^[0-9]+$/.test(body)) return false;

    // Calcular DV
    let suma = 0;
    let multiplo = 2;

    for (let i = body.length - 1; i >= 0; i--) {
        suma += parseInt(body.charAt(i)) * multiplo;
        if (multiplo < 7) multiplo += 1;
        else multiplo = 2;
    }

    const dvEsperado = 11 - (suma % 11);
    let dvCalculado = '';

    if (dvEsperado === 11) dvCalculado = '0';
    else if (dvEsperado === 10) dvCalculado = 'K';
    else dvCalculado = dvEsperado.toString();

    return dv === dvCalculado;
}

/**
 * Formatea un RUT chileno
 * @param rut - RUT sin formato
 * @returns RUT formateado (ej: "12.345.678-9")
 */
export function formatRut(rut: string): string {
    if (!rut) return '';

    const cleanRut = rut.replace(/[^0-9kK]/g, '');

    if (cleanRut.length < 2) return cleanRut;

    const body = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1).toUpperCase();

    // Formatear con puntos
    const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return `${formattedBody}-${dv}`;
}

/**
 * Formatea RUT mientras el usuario escribe
 * @param value - Valor actual del input
 * @returns Valor formateado
 */
export function formatRutInput(value: string): string {
    // Remover todo excepto números y K
    let cleaned = value.replace(/[^0-9kK]/g, '');

    if (cleaned.length === 0) return '';

    // Limitar longitud (máximo 9 dígitos + K)
    if (cleaned.length > 9) {
        cleaned = cleaned.slice(0, 9);
    }

    // Si tiene más de 1 caracter, separar cuerpo y DV
    if (cleaned.length > 1) {
        const body = cleaned.slice(0, -1);
        const dv = cleaned.slice(-1).toUpperCase();

        // Formatear cuerpo con puntos
        const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        return `${formattedBody}-${dv}`;
    }

    return cleaned;
}
