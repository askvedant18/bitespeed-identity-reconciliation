import { Router } from 'express';
import { identify } from '../controllers/identifyController.js';

const router = Router();

router.post('/identify', identify);

export default router;
