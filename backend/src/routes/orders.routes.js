const express = require('express');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/orders.controller');

const router = express.Router();

router.use(authenticate);

router.get('/mine', ctrl.listMyOrders);
router.get('/selling', ctrl.listSellingOrders);
router.post('/', ctrl.placeOrder);
router.get('/:id', ctrl.getOrder);
router.post('/:id/cancel', ctrl.cancelOrder);
router.post('/:id/complete', ctrl.completeOrder);

module.exports = router;
