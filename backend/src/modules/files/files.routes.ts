import { Router } from 'express';
import filesController from './files.controller';
import { authenticate } from '@/middlewares/auth.middleware';

const router = Router();

router.post('/upload', authenticate, filesController.uploadFile.bind(filesController));
router.get('/signed-url/:key', authenticate, filesController.getSignedUrl.bind(filesController));
router.delete('/:key', authenticate, filesController.deleteFile.bind(filesController));

export default router;

