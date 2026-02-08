import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import filesService from './files.service';
import { AuthenticatedRequest, FileUpload } from '@/types';
import prisma from '@/database/prisma';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      // Imágenes
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      // Documentos
      'application/pdf',
      // Audio clínico
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
    ];

    const maxSizes: Record<string, number> = {
      default: 10 * 1024 * 1024, // 10 MB
      'application/pdf': 15 * 1024 * 1024, // PDFs un poco más grandes
      'video/mp4': 0, // rechazado
      'video/quicktime': 0, // rechazado
    };

    const typeAllowed = filesService.validateFileType(file.mimetype, allowedTypes);
    const sizeLimit = maxSizes[file.mimetype] ?? maxSizes.default;
    const sizeAllowed = sizeLimit > 0 && file.size <= sizeLimit;

    if (!typeAllowed) {
      return cb(new Error('Tipo de archivo no permitido'));
    }
    if (!sizeAllowed) {
      return cb(new Error('Archivo supera el tamaño permitido'));
    }
    return cb(null, true);
  },
});

export class FilesController {
  private async assertCanAccessKey(req: AuthenticatedRequest, key: string): Promise<void> {
    const user = req.user;
    if (!user) throw new Error('No autenticado');
    const match = key.match(/^consultations\/([A-Za-z0-9_-]+)/);
    if (!match) {
      throw new Error('Clave de archivo inválida o sin prefijo de consulta');
    }
    const consultationId = match[1];
    const consultation = await prisma.consultation.findUnique({ where: { id: consultationId } });
    if (!consultation) throw new Error('Consulta no encontrada');
    if (user.role === 'ADMIN') return; // admin puede acceder
    const doctorUserId = (await prisma.doctor.findUnique({ where: { id: consultation.doctorId }, select: { userId: true } }))?.userId;
    const patientUserId = (await prisma.patient.findUnique({ where: { id: consultation.patientId }, select: { userId: true } }))?.userId;
    if (user.id !== doctorUserId && user.id !== patientUserId) {
      throw new Error('No tienes permiso para acceder a este archivo');
    }
  }

  async uploadFile(_req: Request, res: Response, next: NextFunction) {
    try {
      const uploadSingle = upload.single('file');

      uploadSingle(_req, res, async (err) => {
        if (err) {
          return next(err);
        }

        if (!_req.file) {
          res.status(400).json({ error: 'Archivo requerido' });
          return;
        }

        const reqAuth = _req as AuthenticatedRequest;
        const consultationId = (_req.body?.consultationId as string) || '';
        if (!consultationId) {
          res.status(400).json({ error: 'Consultation ID requerido' });
          return;
        }

        // Enforce prefijo seguro y ownership de la consulta
        const folder = `consultations/${consultationId}`;
        try {
          await this.assertCanAccessKey(reqAuth, `${folder}/_`);
        } catch (e: any) {
          res.status(403).json({ error: e?.message || 'No autorizado' });
          return;
        }
        const file: FileUpload = {
          fieldname: _req.file.fieldname,
          originalname: _req.file.originalname,
          encoding: _req.file.encoding,
          mimetype: _req.file.mimetype,
          size: _req.file.size,
          buffer: _req.file.buffer,
        };

        const result = await filesService.uploadFile(file, folder);

        res.json({
          success: true,
          data: result,
        });
      });
    } catch (error) {
      next(error);
    }
  }

  async getSignedUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const expiresIn = req.query.expiresIn ? Number(req.query.expiresIn) : 3600;

      try {
        await this.assertCanAccessKey(req as AuthenticatedRequest, key);
      } catch (e: any) {
        res.status(403).json({ error: e?.message || 'No autorizado' });
        return;
      }

      const url = await filesService.getSignedUrl(key, expiresIn);

      res.json({
        success: true,
        data: { url },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      try {
        await this.assertCanAccessKey(req as AuthenticatedRequest, key);
      } catch (e: any) {
        res.status(403).json({ error: e?.message || 'No autorizado' });
        return;
      }
      await filesService.deleteFile(key);

      res.json({
        success: true,
        message: 'Archivo eliminado correctamente',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new FilesController();

