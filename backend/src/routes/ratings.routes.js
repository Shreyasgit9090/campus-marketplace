const express = require('express');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/ratings.controller');

const router = express.Router();

router.post('/', authenticate, ctrl.createRating);
router.get('/user/:userId', ctrl.listRatingsForUser);

module.exports = router;
