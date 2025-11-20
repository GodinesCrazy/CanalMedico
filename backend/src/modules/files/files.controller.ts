import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import filesService from './files.service';
import { authenticate } from '@/middlewares/auth.middleware';
import { FileUpload } from '@/types';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'video/mp4',
      'video/quicktime',
    ];

    if (filesService.validateFileType(file.mimetype, allowedTypes)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  },
});

export class FilesController {
  async uploadFile(req: Request, res: Response, next: NextFunction) {
    try {
      const uploadSingle = upload.single('file');

      uploadSingle(req, res, async (err) => {
        if (err) {
          return next(err);
        }

        if (!req.file) {
          res.status(400).json({ error: 'Archivo requerido' });
          return;
        }

        const folder = req.body.folder || 'uploads';
        const file: FileUpload = {
          fieldname: req.file.fieldname,
          originalname: req.file.originalname,
          encoding: req.file.encoding,
          mimetype: req.file.mimetype,
          size: req.file.size,
          buffer: req.file.buffer,
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

