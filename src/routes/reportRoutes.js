const router = require('express').Router();
const { requireAuth, allowRoles } = require('../middleware/auth');
const controller = require('../controllers/reportController');

router.use(requireAuth, allowRoles('admin', 'seller'));
router.get('/sales-summary', controller.salesSummary);
router.get('/inventory', controller.productsAndInventory);

module.exports = router;
