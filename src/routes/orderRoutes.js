const router = require('express').Router();
const { requireAuth, allowRoles } = require('../middleware/auth');
const controller = require('../controllers/orderController');

router.use(requireAuth);
router.post('/checkout', controller.checkout);
router.get('/', controller.listOrders);
router.get('/:id', controller.getOrder);
router.patch('/:id/status', allowRoles('seller', 'admin'), controller.updateStatus);

module.exports = router;
