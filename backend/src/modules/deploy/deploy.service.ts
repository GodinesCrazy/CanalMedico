/**
 * Deploy Service - Información de Deploy
 * 
 * Proporciona información sobre el deploy actual para validación en Railway
 */

import logger from '@/config/logger';
import * as fs from 'fs';
import * as path from 'path';

interface DeployInfo {
  version: string;
  commitHash: string;
  environment: string;
  buildTimestamp: string;
  nodeVersion: string;
  deployTimestamp: string;
}

/**
 * Obtiene información del deploy actual
 */
export function getDeployInfo(): DeployInfo {
  // Obtener versión de package.json
  let version = '1.0.1';
  try {
    const packagePath = path.join(__dirname, '../../../package.json');
    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      version = packageJson.version || '1.0.1';
    }
  } catch (error: any) {
    logger.warn('[DEPLOY] No se pudo leer versión de package.json:', error.message);
  }

  // Obtener commit hash de variables de entorno (Railway, Vercel, etc.)
  const commitHash = 
    process.env.RAILWAY_GIT_COMMIT_SHA ||
    process.env.RAILWAY_GIT_COMMIT ||
    process.env.GIT_COMMIT_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.CI_COMMIT_SHA ||
    process.env.BUILDKITE_COMMIT ||
    'unknown';

  // Obtener environment
  const environment = process.env.NODE_ENV || 'development';

  // Obtener build timestamp (cuando se compiló)
  // Intentar leer desde archivo .build-timestamp primero
  let buildTimestamp = process.env.BUILD_TIMESTAMP || process.env.BUILD_DATE;
  if (!buildTimestamp) {
    try {
      const buildTimestampPath = path.join(__dirname, '../../../.build-timestamp');
      if (fs.existsSync(buildTimestampPath)) {
        const timestampContent = fs.readFileSync(buildTimestampPath, 'utf-8');
        // Extraer timestamp del contenido (ej: "Build completed at 2024-11-23T10:00:00Z")
        const match = timestampContent.match(/(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}[\w:+-]*)/);
        if (match) {
          buildTimestamp = match[1];
        }
      }
    } catch (error: any) {
      logger.debug('[DEPLOY] No se pudo leer .build-timestamp:', error.message);
    }
  }
  buildTimestamp = buildTimestamp || new Date().toISOString();

  // Obtener deploy timestamp (cuando se desplegó)
  const deployTimestamp = process.env.DEPLOY_TIMESTAMP || process.env.START_TIME || new Date().toISOString();

  // Obtener versión de Node.js
  const nodeVersion = process.version;

  return {
    version,
    commitHash,
    environment,
    buildTimestamp,
    nodeVersion,
    deployTimestamp,
  };
}

