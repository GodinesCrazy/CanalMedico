/**
 * Deploy Routes - Información de Deploy
 */

import { Router } from 'express';
import { DeployController } from './deploy.controller';
import logger from '@/config/logger';

const router = Router();

/**
 * @swagger
 * /api/deploy/info:
 *   get:
 *     summary: Obtiene información del deploy actual
 *     description: Retorna versión, commit hash, environment y timestamps del deploy
 *     tags: [Deploy]
 *     responses:
 *       200:
 *         description: Información de deploy obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     version:
 *                       type: string
 *                       example: "1.0.1"
 *                     commitHash:
 *                       type: string
 *                       example: "abc123..."
 *                     environment:
 *                       type: string
 *                       example: "production"
 *                     buildTimestamp:
 *                       type: string
 *                       example: "2024-11-23T10:00:00.000Z"
 *                     deployTimestamp:
 *                       type: string
 *                       example: "2024-11-23T10:05:00.000Z"
 *                     nodeVersion:
 *                       type: string
 *                       example: "v18.17.0"
 *       500:
 *         description: Error al obtener información de deploy
 */
router.get('/info', DeployController.getDeployInfo);

logger.info('[DEPLOY] Deploy routes registered at /api/deploy');

export default router;

