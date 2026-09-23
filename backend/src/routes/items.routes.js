const express = require('express');
const { authenticate } = require('../middleware/auth');
const { uploadItemImages } = require('../middleware/upload');
const ctrl = require('../controllers/items.controller');

const router = express.Router();

// Specific paths before the /:id catch-all.
router.get('/preview-price', ctrl.previewPrice);
router.get('/mine', authenticate, ctrl.listMyItems);

router.get('/', ctrl.listItems);
router.get('/:id', ctrl.getItem);
router.post('/', authenticate, uploadItemImages.array('images', 6), ctrl.createItem);
router.patch('/:id', authenticate, ctrl.updateItem);
router.delete('/:id', authenticate, ctrl.deleteItem);

module.exports = router;
