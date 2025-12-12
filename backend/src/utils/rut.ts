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

export function formatRut(rut: string): string {
    if (!validateRut(rut)) return rut;

    const cleanRut = rut.replace(/[^0-9kK]/g, '');
    const body = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1).toUpperCase();

    return `${body}-${dv}`;
}

/**
 * Extrae RUN y DV de un RUT formateado
 * @param rut RUT en cualquier formato (ej: "12.345.678-9", "12345678-9", "123456789")
 * @returns Objeto con rut (solo números) y dv (dígito verificador)
 */
export function extractRutAndDv(rut: string): { rut: string | null; dv: string | null } {
    if (!rut || typeof rut !== 'string') {
        return { rut: null, dv: null };
    }

    // Limpiar RUT (solo números y K)
    const cleanRut = rut.replace(/[^0-9kK]/g, '');

    if (cleanRut.length < 2) {
        return { rut: null, dv: null };
    }

    const body = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1).toUpperCase();

    // Validar que el cuerpo sea numérico
    if (!/^[0-9]+$/.test(body)) {
        return { rut: null, dv: null };
    }

    return { rut: body, dv };
}
