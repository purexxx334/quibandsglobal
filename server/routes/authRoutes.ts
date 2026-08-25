import { Router } from 'express';
import { authController } from '../controllers/authController';

const router = Router();

// Public instant registration route (No email verification required)
router.post('/register', (req, res, next) => authController.register(req, res, next));

// Public identifier resolution route (Resolve mobile phone number or email to auth account)
router.post('/resolve-identifier', (req, res, next) => authController.resolveIdentifier(req, res, next));

export default router;
