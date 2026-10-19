import express from 'express';
import {
  getAllPatients,
  getPatientHistory,
  createOrUpdatePatient,
} from '../controllers/patientController.js';

const router = express.Router();

router.get('/', getAllPatients);
router.post('/', createOrUpdatePatient);
router.get('/:id', getPatientHistory);

export default router;
