import { Router } from 'express';
import messagesController, { validateCreateMessage } from './messages.controller';
import { authenticate } from '@/middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, validateCreateMessage, messagesController.create.bind(messagesController));
router.get('/consultation/:consultationId', authenticate, messagesController.getByConsultation.bind(messagesController));
router.get('/:id', authenticate, messagesController.getById.bind(messagesController));

export default router;

