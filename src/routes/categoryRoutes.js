const router = require('express').Router();
const { requireAuth, allowRoles } = require('../middleware/auth');
const controller = require('../controllers/categoryController');
const { requiredFields } = require('../middleware/validate');

router.get('/', controller.listCategories);
router.post('/', requireAuth, allowRoles('admin'), requiredFields(['name', 'slug']), controller.createCategory);
router.patch('/:id', requireAuth, allowRoles('admin'), controller.updateCategory);
router.delete('/:id', requireAuth, allowRoles('admin'), controller.deleteCategory);

module.exports = router;
