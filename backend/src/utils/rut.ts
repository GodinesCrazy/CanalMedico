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
