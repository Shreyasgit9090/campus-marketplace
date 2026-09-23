const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/admin.controller');

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/reports', ctrl.listReports);
router.patch('/reports/:id', ctrl.reviewReport);
router.get('/users', ctrl.listUsers);
router.patch('/users/:id/suspend', ctrl.suspendUser);
router.patch('/users/:id/unsuspend', ctrl.unsuspendUser);

module.exports = router;
