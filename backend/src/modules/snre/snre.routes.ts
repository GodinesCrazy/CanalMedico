/**
 * Rutas para el m�dulo de recetas SNRE
 */

import { Router } from 'express';
import snreController, { validateCreatePrescription } from './snre.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import { requirePrescriptionOwnership, requireConsultationOwnership } from '@/middlewares/ownership.middleware';

const router = Router();

/**
 * @swagger
 * /api/prescriptions:
 *   post:
 *     summary: Crear una receta electr�nica SNRE
 *     tags: [Prescriptions]
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
 *               - medications
 *             properties:
 *               consultationId:
 *                 type: string
 *               medications:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - medicationName
 *                     - dosage
 *                     - frequency
 *                   properties:
 *                     medicationName:
 *                       type: string
 *                     tfcCode:
 *                       type: string
 *                     snomedCode:
 *                       type: string
 *                     presentation:
 *                       type: string
 *                     pharmaceuticalForm:
 *                       type: string
 *                     dosage:
 *                       type: string
 *                     frequency:
 *                       type: string
 *                     duration:
 *                       type: string
 *                     quantity:
 *                       type: string
 *                     instructions:
 *                       type: string
 *               recetaType:
 *                 type: string
 *                 enum: [simple, retenida]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Receta creada exitosamente
 *       400:
 *         description: Error de validaci�n
 *       403:
 *         description: No autorizado
 */
router.post('/', authenticate, validateCreatePrescription, requireConsultationOwnership, snreController.create.bind(snreController));

/**
 * @swagger
 * /api/prescriptions/{id}:
 *   get:
 *     summary: Obtener una receta por ID
 *     tags: [Prescriptions]
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
 *         description: Receta encontrada
 *       404:
 *         description: Receta no encontrada
 */
router.get('/:id', authenticate, requirePrescriptionOwnership, snreController.getById.bind(snreController));

/**
 * @swagger
 * /api/consultations/{consultationId}/prescriptions:
 *   get:
 *     summary: Obtener todas las recetas de una consulta
 *     tags: [Prescriptions]
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
 *         description: Lista de recetas
 */
// Ruta alternativa para obtener recetas de una consulta
const consultationsRouter = Router();
consultationsRouter.get('/:consultationId/prescriptions', authenticate, requireConsultationOwnership, snreController.getByConsultation.bind(snreController));
export { consultationsRouter as consultationsPrescriptionsRoutes };

export default router;
