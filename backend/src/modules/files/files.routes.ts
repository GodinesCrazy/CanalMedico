import { Router } from 'express';
import filesController from './files.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validation.middleware';
import { z } from 'zod';
import { requireConsultationOwnership } from '@/middlewares/ownership.middleware';

const router = Router();

const uploadSchema = z.object({
  body: z.object({
    consultationId: z.string().min(1, 'Consultation ID requerido'),
  }),
});

/**
 * @swagger
 * /api/files/upload:
 *   post:
 *     summary: Subir archivo a S3 (atado a una consulta)
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - consultationId
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               consultationId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Archivo subido exitosamente
 *       401:
 *         description: No autenticado
 */
router.post(
  '/upload',
  authenticate,
  validate(uploadSchema),
  requireConsultationOwnership,
  filesController.uploadFile.bind(filesController)
);

/**
 * @swagger
 * /api/files/signed-url/{key}:
 *   get:
 *     summary: Obtener URL firmada para descargar archivo
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: URL firmada generada exitosamente
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Archivo no encontrado
 */
router.get('/signed-url/:key', authenticate, filesController.getSignedUrl.bind(filesController));

/**
 * @swagger
 * /api/files/{key}:
 *   delete:
 *     summary: Eliminar archivo de S3
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Archivo eliminado exitosamente
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Archivo no encontrado
 */
router.delete('/:key', authenticate, filesController.deleteFile.bind(filesController));

export default router;

