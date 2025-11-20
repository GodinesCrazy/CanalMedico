import { Router } from 'express';
import messagesController, { validateCreateMessage } from './messages.controller';
import { authenticate } from '@/middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Crear nuevo mensaje en una consulta
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - consultationId
 *               - senderId
 *             properties:
 *               consultationId:
 *                 type: string
 *               senderId:
 *                 type: string
 *               text:
 *                 type: string
 *               fileUrl:
 *                 type: string
 *               audioUrl:
 *                 type: string
 *               pdfUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Mensaje creado exitosamente
 *       401:
 *         description: No autenticado
 */
router.post('/', authenticate, validateCreateMessage, messagesController.create.bind(messagesController));

/**
 * @swagger
 * /api/messages/consultation/{consultationId}:
 *   get:
 *     summary: Obtener mensajes de una consulta
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de mensajes de la consulta
 *       401:
 *         description: No autenticado
 */
router.get('/consultation/:consultationId', authenticate, messagesController.getByConsultation.bind(messagesController));

/**
 * @swagger
 * /api/messages/{id}:
 *   get:
 *     summary: Obtener mensaje por ID
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Información del mensaje
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Mensaje no encontrado
 */
router.get('/:id', authenticate, messagesController.getById.bind(messagesController));

export default router;

