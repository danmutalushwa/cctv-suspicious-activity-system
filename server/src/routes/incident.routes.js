const express = require('express');
const router = express.Router();

const incidentController = require('../controllers/incident.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { upload, handleMulterError } = require('../config/multer');
const {
  validateCreateIncident,
  validateUpdateIncident,
  validateAddNote,
  validateAddEvidence,
  validateAssignIncident,
  validateResolveIncident,
  validateQueryParams,
  validate
} = require('../validators/incident.validator');
const { USER_ROLES } = require('../config/constants');

// All routes require authentication
router.use(protect);

// GET statistics - accessible to all authenticated users
router.get('/statistics', incidentController.getIncidentStatistics);

// GET all incidents with filters
router.get('/', validateQueryParams, validate, incidentController.getAllIncidents);

// POST create incident
router.post(
  '/',
  validateCreateIncident,
  validate,
  incidentController.createIncident
);

// GET incident by ID
router.get('/:id', incidentController.getIncidentById);

// PUT update incident
router.put(
  '/:id',
  validateUpdateIncident,
  validate,
  incidentController.updateIncident
);

// DELETE incident
router.delete('/:id', incidentController.deleteIncident);

// POST assign incident
router.post(
  '/:id/assign',
  validateAssignIncident,
  validate,
  incidentController.assignIncident
);

// POST resolve incident
router.post(
  '/:id/resolve',
  validateResolveIncident,
  validate,
  incidentController.resolveIncident
);

// POST add note
router.post(
  '/:id/notes',
  validateAddNote,
  validate,
  incidentController.addNote
);

// POST upload evidence
router.post(
  '/:id/evidence',
  upload.array('files', 10),
  handleMulterError,
  validateAddEvidence,
  validate,
  incidentController.uploadEvidence
);

module.exports = router;