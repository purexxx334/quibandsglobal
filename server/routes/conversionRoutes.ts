import { Router } from 'express';
import { ConversionController } from '../controllers/conversionController';
import { requireAuth } from '../middleware/auth';

const router = Router();
const conversionController = new ConversionController();

router.use(requireAuth);

router.post('/', (req, res, next) => conversionController.createConversion(req, res, next));
router.get('/me', (req, res, next) => conversionController.getMyConversions(req, res, next));
router.get('/', (req, res, next) => conversionController.getAllConversions(req, res, next));
router.patch('/:id/status', (req, res, next) => conversionController.updateConversionStatus(req, res, next));

export default router;
