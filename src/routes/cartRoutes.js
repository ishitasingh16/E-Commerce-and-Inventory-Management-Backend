const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const controller = require('../controllers/cartController');
const { requiredFields, positiveInteger } = require('../middleware/validate');

router.use(requireAuth, controller.customerCart);
router.get('/', controller.getCart);
router.post('/items', requiredFields(['productId']), controller.addItem);
router.patch('/items/:productId', requiredFields(['quantity']), positiveInteger('quantity'), controller.updateItem);
router.delete('/items/:productId', controller.removeItem);

module.exports = router;
