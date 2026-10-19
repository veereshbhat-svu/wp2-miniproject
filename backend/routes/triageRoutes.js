import express from 'express';
import { submitTriage, getPresets } from '../controllers/triageController.js';

const router = express.Router();

router.get('/presets', getPresets);
router.post('/submit', submitTriage);

export default router;
