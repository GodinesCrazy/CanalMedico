/**
 * Deploy Controller - Información de Deploy
 */

import { Request, Response } from 'express';
import { getDeployInfo } from './deploy.service';
import logger from '@/config/logger';

export class DeployController {
  /**
   * GET /api/deploy/info
   * Retorna información del deploy actual
   */
  static async getDeployInfo(_req: Request, res: Response): Promise<void> {
    try {
      logger.info('[DEPLOY] GET /api/deploy/info called');
      
      const deployInfo = getDeployInfo();
      
      res.status(200).json({
        success: true,
        data: deployInfo,
        message: 'Deploy information retrieved successfully',
      });
    } catch (error: any) {
      logger.error('[DEPLOY] Error al obtener información de deploy:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener información de deploy',
        details: error?.message || 'Error desconocido',
      });
    }
  }
}

