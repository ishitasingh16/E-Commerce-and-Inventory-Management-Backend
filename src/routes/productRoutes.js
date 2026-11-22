const router = require('express').Router();
const { requireAuth, allowRoles } = require('../middleware/auth');
const controller = require('../controllers/productController');
const { requiredFields } = require('../middleware/validate');

router.get('/', controller.listProducts);
router.get('/:id', controller.getProduct);
router.post('/', requireAuth, allowRoles('seller', 'admin'), requiredFields(['title', 'price', 'category']), controller.createProduct);
router.patch('/:id', requireAuth, allowRoles('seller', 'admin'), controller.updateProduct);
router.delete('/:id', requireAuth, allowRoles('seller', 'admin'), controller.deleteProduct);

module.exports = router;
