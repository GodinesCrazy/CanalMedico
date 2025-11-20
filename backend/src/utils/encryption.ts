import crypto from 'crypto';
import env from '@/config/env';

const algorithm = 'aes-256-cbc';
const keyLength = 32;
const ivLength = 16;

// Generar o usar una clave fija (en producción, guardarla en variables de entorno)
const getEncryptionKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY || env.JWT_SECRET.substring(0, keyLength);
  return crypto.scryptSync(key, 'salt', keyLength);
};

export const encrypt = (text: string): string => {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(ivLength);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    throw new Error('Error al encriptar datos');
  }
};

export const decrypt = (encryptedText: string): string => {
  try {
    const key = getEncryptionKey();
    const parts = encryptedText.split(':');
    
    if (parts.length !== 2) {
      throw new Error('Formato de texto encriptado inválido');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv(algorithm, key, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error('Error al desencriptar datos');
  }
};

