const express = require('express');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/users.controller');

const router = express.Router();

router.get('/me', authenticate, ctrl.getMe);
router.patch('/me', authenticate, ctrl.updateMe);
router.get('/me/transactions', authenticate, ctrl.getMyTransactions);
router.get('/:id/public', ctrl.getPublicProfile);

module.exports = router;
