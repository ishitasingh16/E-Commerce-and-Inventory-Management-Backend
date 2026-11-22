const router = require('express').Router();
const { requireAuth, allowRoles } = require('../middleware/auth');
const controller = require('../controllers/userController');

router.use(requireAuth);
router.get('/me', controller.getMe);
router.patch('/me', controller.updateMe);
router.get('/', allowRoles('admin'), controller.listUsers);
router.patch('/:id/role', allowRoles('admin'), controller.changeRole);

module.exports = router;
