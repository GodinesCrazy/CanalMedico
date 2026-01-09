import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import env from '@/config/env';
import { createError } from '@/middlewares/error.middleware';
import logger from '@/config/logger';
import { FileUpload, S3UploadResult } from '@/types';
import crypto from 'crypto';

// Crear cliente S3 solo si las credenciales están configuradas
const s3ClientConfig: any = {
  region: env.AWS_REGION || 'us-east-1',
};

if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
  s3ClientConfig.credentials = {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  };
}

const s3Client = new S3Client(s3ClientConfig);

export class FilesService {
  private generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = originalName.split('.').pop();
    return `${timestamp}-${randomString}.${extension}`;
  }

  private getContentType(mimetype: string): string {
    const contentTypes: Record<string, string> = {
      'image/jpeg': 'image/jpeg',
      'image/png': 'image/png',
      'image/gif': 'image/gif',
      'image/webp': 'image/webp',
      'application/pdf': 'application/pdf',
      'audio/mpeg': 'audio/mpeg',
      'audio/mp3': 'audio/mpeg',
      'audio/wav': 'audio/wav',
      'audio/ogg': 'audio/ogg',
      'video/mp4': 'video/mp4',
      'video/quicktime': 'video/quicktime',
    };

    return contentTypes[mimetype] || 'application/octet-stream';
  }

  async uploadFile(file: FileUpload, folder: string = 'uploads'): Promise<S3UploadResult> {
    try {
      if (!env.AWS_S3_BUCKET) {
        throw createError('AWS S3 no configurado', 500);
      }

      const fileName = this.generateFileName(file.originalname);
      const key = `${folder}/${fileName}`;

      const command = new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: this.getContentType(file.mimetype),
        ACL: 'private', // Archivos privados por seguridad médica
      });

      await s3Client.send(command);

      const url = `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;

      logger.info(`Archivo subido a S3: ${key}`);

      return {
        url,
        key,
        bucket: env.AWS_S3_BUCKET,
      };
    } catch (error) {
      logger.error('Error al subir archivo a S3:', error);
      throw createError('Error al subir archivo', 500);
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      if (!env.AWS_S3_BUCKET) {
        throw createError('AWS S3 no configurado', 500);
      }

      const command = new GetObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: key,
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      logger.error('Error al generar URL firmada:', error);
      throw createError('Error al generar URL de acceso', 500);
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      if (!env.AWS_S3_BUCKET) {
        throw createError('AWS S3 no configurado', 500);
      }

      const command = new DeleteObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: key,
      });

      await s3Client.send(command);
      logger.info(`Archivo eliminado de S3: ${key}`);
    } catch (error) {
      logger.error('Error al eliminar archivo de S3:', error);
      throw createError('Error al eliminar archivo', 500);
    }
  }

  validateFileType(mimetype: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes(mimetype);
  }

  validateFileSize(size: number, maxSize: number): boolean {
    return size <= maxSize;
  }
}

export default new FilesService();

