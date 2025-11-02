import { Router } from 'express';
import auth from './authRoutes';
import requests from './requestRoutes';

const router = Router();
router.use('/auth', auth);
router.use('/requests', requests);

export default router;