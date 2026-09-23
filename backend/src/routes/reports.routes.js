const express = require('express');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/reports.controller');

const router = express.Router();

router.use(authenticate);
router.post('/', ctrl.createReport);
router.get('/mine', ctrl.listMyReports);

module.exports = router;
