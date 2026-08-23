import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /api/health
 * Public health check endpoint
 */
router.get('/', (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Quibands Global Core API',
    version: '1.0.0',
  });
});

export default router;
